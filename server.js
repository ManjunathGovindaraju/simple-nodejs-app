var express = require( 'express')
var request = require('request')

var app = express()
fs = require('fs')

app.set('json spaces', 4)

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


app.get( '/news', function ( req, res) {
  res.json({
    "Header": "Welcome to Dilip news portal..." ,
    "News1":  "- Rupee suffers 43 paise knock to end at lifetime low of 69.05",
  });
  res.status(200);
})

app.get( '/health', function ( req, res) {
  res.json("Service is up and running!!!");
  res.status(200);
})

app.listen( process.env.PORT || 4000)
