// app-bound services environment variables
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
  }



}
