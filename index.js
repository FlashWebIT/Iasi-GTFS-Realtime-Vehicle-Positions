var request = require('request'),
  protobuf = require("protobufjs"),
  express = require("express"),
  schedule = require('node-schedule'),
  app = express();

var globCode1;

function updateFeed(){

  protobuf.load("gtfs-realtime.proto", function(err, root) {
      if (err)
          throw err;
      var FeedMessage = root.lookupType("transit_realtime.FeedMessage");
      var payload = { 
        header:{
        gtfsRealtimeVersion: "1.0",
        incrementality: 0,
        timestamp:Math.round(Date.now()/1000)+7200
      },
      entity:[
        
      ]
    };

request({
  method: 'GET',
  url: 'https://gps.sctpiasi.ro/json',
  encoding: "UTF-8",
}, function (error, response, body) {
      if (!error && response.statusCode == 200) {
      	temp = JSON.parse(body);
      	for (var i = temp.length - 1; i >= 0; i--) {
      		payload.entity.push({
            id: i.toString(),
            vehicle: {
              trip: {},
              vehicle: { label: temp[i].vehicleName },
              position: { latitude: parseFloat(temp[i].vehicleLat), longitude: parseFloat(temp[i].vehicleLong) },
              timestamp: (new Date(temp[i].vehicleDate).getTime()/1000)
            }
          });
      	}

        var errMsg = FeedMessage.verify(payload);
        if (errMsg)
            throw Error(errMsg);
        var message = FeedMessage.create(payload);
        globCode1 = (FeedMessage.encode(message).finish());

        FeedMessage = root.lookupType("transit_realtime.FeedMessage");
        payload = { 
          header:{
          gtfsRealtimeVersion: "1.0",
          incrementality: 0,
          timestamp:Math.round(Date.now()/1000)+7200
        },
        entity:[
          
        ]
      };
    }
  });
});
}

app.get('/positions', function(req, res){ // editor page
  console.log('Request protobuf');
  res.send(globCode1);
});

updateFeed();

var j = schedule.scheduleJob('* * * * *', function(){
  updateFeed();
});

app.listen(3000);
