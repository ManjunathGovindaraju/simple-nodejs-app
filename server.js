var express = require( 'express');
var request = require('request');
var bodyParser = require('body-parser');
var qr = require('qr-image');

var multer = require('multer'); // v1.0.5
var upload = multer(); // for parsing multipart/form-data

var cf_svc = require( './utilities/vcap-service.js');

var pg = require('pg');
var fs = require('fs');


var app = express()
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded


app.set('json spaces', 4)
//READ FROM DATABASE
app.get( '/', function ( req, res) {
  var latitude = req.query.Lat;
  var longitude = req.query.Lng;
  var results = {};
  if (latitude && longitude) {
    var db_uri = cf_svc.get_elephantsql_uri();
    var client = new pg.Client(db_uri);

    client.connect(function(err) {
      if(err) {
        return console.error('could not connect to postgres', err);
      }
      var queryString = 'SELECT * FROM offer_db';

      client.query(queryString, function(err, result) {
        if(err) {
          return console.error('error running query', err);
        }

        results['results']=result.rows;
        //var response = result.rows;

        res.json(results);
        client.end();
      });
    });
  }
})

/*
//HARDCODE FROM FILES
app.get( '/', function ( req, res) {
  var latitude = req.query.Lat;
  var longitude = req.query.Lng;

  let rawdata = fs.readFileSync('dummyResult.json');
  let jsondata = JSON.parse(rawdata);
  if (latitude && longitude) {
    jsondata["Latitude"] = latitude;
    jsondata["Longitude"] = longitude;

    request(
      'https://maps.googleapis.com/maps/api/geocode/json?latlng=' +
      latitude+
      ','+
      longitude+
      '&sensor=false&key=AIzaSyBHejobPoAWEc3c-6tmsfidzJ-5_0T65A0',
      {
        json: true
      }, (err, res1, body) => {
        if (err) {
          res.json(jsondata);
          res.status(200);
        } else {
          if (body.results[0]) {
            jsondata["Address"] = body.results[0].formatted_address;
          }
          res.json(jsondata);
          res.status(200);
        }
      });
  } else {
    res.send("Please provide latitude and longitude");
    res.status(400);
  }
})
*/
app.get( '/getdetails', function ( req, res) {
  var adv_id = req.query.id;

  if (adv_id) {
    var db_uri = cf_svc.get_elephantsql_uri();
    var client = new pg.Client(db_uri);

    client.connect(function(err) {
      if(err) {
        return console.error('could not connect to postgres', err);
      }
      var queryString = 'SELECT * FROM offer_details_db WHERE adv_id='+adv_id;

      client.query(queryString, function(err, result) {
        if(err) {
          client.end();
          res.send("Failed to retrieve the result");
          res.status(404);
          return console.error('error running query', err);
        }
        if(result && result.rows) {

          var response = result.rows[0];
          var qri = "Redeem Code: "+response["redeem_code"];
          var qrcode = qr.image(qri, { type: 'png' });
          //response["qr-image"] = qrcode;
          qrcode.pipe(res);
          res.json(response);
          res.status(200);
          client.end();
        } else {
          var results = {};
          res.json(results);

          res.send(404);
        }
      });
    });

  }


})

app.get( '/offercode', function ( req, res) {
  var redeem_code = cf_svc.get_offer_code();
  //var qrCode = cf_svc.get_offer_qr_code(redeem_code);
  //res.send(redeem_code);
  //res.type('jpeg');
  //code.pipe(res);

  var qri = "Redeem Code: "+redeem_code;
  var qrcode = qr.image(qri, { type: 'png' });

  res.type('png');
  qrcode.pipe(res);

})





app.post( '/offers', upload.array(), function (req, res, next) {
  var lat = parseFloat(req.body["latitute"]);
  var lng = parseFloat(req.body["longitude"]);
  var company = req.body["company"];
  var shortoffer = req.body["short_offer"];
  var longoffer = req.body["long_offer"];
  var validity = req.body["validity"];
  var poster = req.body["poster"];

  var db_uri = cf_svc.get_elephantsql_uri();
  var client = new pg.Client(db_uri);

  client.connect(function(err) {
    if(err) {
      return console.error('could not connect to postgres', err);
      res.status(500);
    }
    var queryString =
      'INSERT INTO offer_db (latitute, longitude, company, shortoffer, poster) VALUES(' +
      lat + ', ' +
      lng + ', ' +
      '\'' + company + '\', ' +
      '\'' + shortoffer + '\', ' +
      '\'' + poster + '\')' +
      ' returning adv_id';
    client.query(queryString, function(err, result) {
      if(err) {
        client.end();
        return console.error('error while adding to offer_db', err);
      }
      console.log("***resut result.rows[0].adv_id",result.rows[0].adv_id);
      //generate a new offer code
      var redeem_code = cf_svc.get_offer_code();
      console.log("***** redeem : " + redeem_code);
      var sqString =
        'INSERT INTO offer_details_db VALUES(' +
        parseInt(result.rows[0].adv_id) + ', ' +
        lat + ', ' +
        lng + ', ' +
        '\'' + company + '\', ' +
        '\'' + longoffer + '\', ' +
        '\'' + validity + '\', ' +
        '\'' + poster + '\', ' +
        '\'' + redeem_code + '\')';
      client.query(sqString, function(err, result) {
        if(err) {
          client.end();
          return console.error('error while adding to offer_db_details', err);
        }
        console.log("*** offer Added Successfully***");
        client.end();
      });
    });
    res.send("Record Added Successfully");
    res.status(200);
  });

})

app.get( '/offers', function ( req, res) {
  var latitute = req.query.Lat;
  var longitude = req.query.Lng;
  var results = {};
  if (latitute && longitude) {
    var db_uri = cf_svc.get_elephantsql_uri();
    var client = new pg.Client(db_uri);

    client.connect(function(err) {
      if(err) {
        return console.error('could not connect to postgres', err);
      }
      var queryString =
        'SELECT * FROM offer_db WHERE latitute=' + latitute +
        'AND longitude=' + longitude;

      client.query(queryString, function(err, result) {
        if(err) {
          return console.error('error running query', err);
        }
        results['results']=result.rows;
        res.json(results);
        client.end();
      });
    });
  }
})

app.delete( '/offers', function ( req, res) {
  var adv_id = req.query.id;
  var results = {};
  if (adv_id) {
    var db_uri = cf_svc.get_elephantsql_uri();
    var client = new pg.Client(db_uri);

    client.connect(function(err) {
      if(err) {
        return console.error('could not connect to postgres', err);
      }
      //delete from offer parent database
      var queryString = 'DELETE FROM offer_db WHERE adv_id=' + adv_id;
      client.query(queryString, function(err, result) {
        if(err) {
          client.end();
          return console.error('Unable to delete from offer_db', err);
        }
        //delete from offer details database
        var qString = 'DELETE FROM offer_details_db WHERE adv_id=' + adv_id;
        client.query(qString, function(err, result) {
          if(err) {
            client.end();
            return console.error('Unable to delete from offer_details_db', err);
          }
          res.send("Successfully deleted the advertisement id :" + adv_id);
          console.log("Delete advertisement Successfully")
          res.status(202);
          client.end();
        });
      });
    });
  } else {
    res.send("Please provide adv_id");
    res.status(404);
  }
})



app.get( '/news', function ( req, res) {
  let rawdata = fs.readFileSync('news.json');
  let jsondata = JSON.parse(rawdata);
  res.json(jsondata);
  res.status(200);

})


app.get( '/env', function ( req, res) {
  res.send(process.env.VCAP_SERVICES);
  res.status(200);
})

app.get( '/getoffers', function ( req, res) {
  var lat = req.query.Lat;
  var lng = req.query.Lng;


  var db_uri = cf_svc.get_elephantsql_uri();
  var client = new pg.Client(db_uri);

  client.connect(function(err) {
    if(err) {
      return console.error('could not connect to postgres', err);
    }
    var queryString = 'SELECT * FROM advertise WHERE latitute='+lat+' AND longitude='+lng;

    client.query(queryString, function(err, result) {
      if(err) {
        return console.error('error running query', err);
      }
      var response = result.rows;

      res.send(response);
      client.end();
    });
  });


})





app.get( '/health', function ( req, res) {
  res.json("Service is up and running!!! ");
  res.status(200);
})

//  URI: /getofferwithinrange/?Lat=...&Lng=...&range=...
app.get( '/getofferwithinrange', function ( req, res) {
  var latitute = req.query.Lat;
  var longitude = req.query.Lng;
  var currentPlace = {lat: latitute, lon: longitude};

  var range = req.query.range;
  if(!range){
    //if range is not provided then set it to 5kms
    range = 5;
  }
  var results = {};
  if (latitute && longitude) {
    var db_uri = cf_svc.get_elephantsql_uri();
    var client = new pg.Client(db_uri);

    client.connect(function(err) {
      if(err) {
        return console.error('could not connect to postgres', err);
      }
      var queryString = 'SELECT * FROM offer_db';
      client.query(queryString, function(err, result) {
        if(err) {
          client.end();
          return console.error('error running query', err);
        }
        var dbResult = result.rows;
        var finalResult = [];
        for(var item of dbResult) {

          var advLocation = {lat: item.latitute, lon: item.longitude};
          var dist = cf_svc.get_geo_distance(currentPlace, advLocation);
          if(dist<=range) {
            var newItem = {};
            newItem["distance"]=dist;
            newItem["adv_id"]=item.adv_id;
            newItem["latitute"]=item.latitute;
            newItem["longitude"]=item.longitude;
            newItem["company"]=item.company;
            newItem["shortoffer"]=item.shortoffer;
            newItem["poster"]=item.poster;
            finalResult.push(newItem);
          }

        }
        results['results']=finalResult;
        res.json(results);
        client.end();
      });
    });
  }
})






app.listen( process.env.PORT || 4000)
