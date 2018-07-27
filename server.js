var express = require( 'express');
var request = require('request');
var bodyParser = require('body-parser');
var multer = require('multer'); // v1.0.5
var upload = multer(); // for parsing multipart/form-data

var cf_svc = require( './utilities/vcap-service.js');

var pg = require('pg');
var fs = require('fs');


var app = express()
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded


app.set('json spaces', 4)
/*
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
          return console.error('error running query', err);
        }

        var response = result.rows[0];

        res.json(response);
        client.end();
      });
    });

  }


})

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



app.post( '/offers', upload.array(), function (req, res, next) {
  var lat = parseFloat(req.body["Latitude"]);
  var lng = parseFloat(req.body["Longitude"]);
  var company = req.body["Company"];
  var shortoffer = req.body["Short_Offer"];
  var longoffer = req.body["Long_Offer"];
  var validity = req.body["Validity"];
  var addid = req.body["AddID"];
  var poster = req.body["Poster"];

  var db_uri = cf_svc.get_elephantsql_uri();
  var client = new pg.Client(db_uri);

  client.connect(function(err) {
    if(err) {
      return console.error('could not connect to postgres', err);
      res.status(500);
    }
    var queryString =
      'INSERT INTO advertise VALUES(' +
      lat + ', ' +
      lng + ', ' +
      '\'' + company + '\', ' +
      '\'' + shortoffer + '\', ' +
      '\'' + longoffer + '\', ' +
      '\'' + validity + '\', ' +
      '\'' + addid + '\', ' +
      '\'' + poster + '\')' ;
    client.query(queryString, function(err, result) {
      if(err) {
        return console.error('error running query', err);
      }

      client.end();
    });
    res.send(res.body);
    res.status(200);
  });

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

app.listen( process.env.PORT || 4000)
