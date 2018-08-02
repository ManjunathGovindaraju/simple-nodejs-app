// app-bound services environment variables
var voucher_codes = require('voucher-code-generator');
var qr = require('qr-image');
var geodist = require('geodist');

module.exports = {
  get_elephantsql_uri: function () {
    if (process.env.VCAP_SERVICES) {
      var svc_info = JSON.parse(process.env.VCAP_SERVICES)
      for (var label in svc_info) {
        var svcs = svc_info[label]
        for (var index in svcs) {
          if(svcs[index].label == "elephantsql"){
            var label = svcs[index].credentials.uri
            return label
          }
        }
      }
    }
  },

  get_offer_code: function () {
    var offercode = voucher_codes.generate({prefix: "dilip-promo-",postfix: "-2018"});
    return offercode[0];

  },

  get_offer_qr_code: function (code) {
    var qri = "Redeem Code: "+code;
    var qrcode = qr.image(qri, { type: 'jpeg' });
    return qrcode;
  },

  get_geo_distance: function (place1, place2) {

    //var dist = geodist({lat: 41.85, lon: -87.65}, {lat: 33.7489, lon: -84.3881})
    var dist = geodist(place1, place2, {exact: true, unit: 'km'});
    return dist;
  }



}
