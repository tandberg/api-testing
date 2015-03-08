var https = require('https');
var args = process.argv.slice(2);

var KEY = "";
var LAT_LNG = "63.417411,10.4092442"; // Tidemands gate 24
var RADIUS = 700; // Meters
var TYPES = "grocery_or_supermarket";
var MODE = "walking";

var base_url = "https://maps.googleapis.com/maps/api"
var base_place_url = base_url + "/place/radarsearch/json";
var base_details_url = base_url + "/place/details/json";
var base_distance_url = base_url + "/distancematrix/json";

args.forEach(function(arg) {
  var arr = arg.split('=');
  if(arr[0] === '--radius' || arr[0] === '-r') {
    RADIUS = parseInt(arr[1], 0);
  }

  if(arr[0] === '--location' || arr[0] == '-l') {
    LAT_LNG = arr[1];
  }

  if(arr[0] === '--types' || arr[0] == '-t') {
    TYPES = arr[1];
  }

  if(arr[0] === '--help' || arr[0] == '-h') {
    console.log('--location\t -l \t Lat, lng e.g 63.417411,10.4092442');
    console.log('--radius\t -r \t Meters e.g 500');
    console.log('--types\t\t -t \t Types e.g bank|food');
    console.log('--help\t\t -h \t This message');
    process.kill();
  }
});

var requestPlace = function(place_id, cb) {
  https.get(base_details_url + "?placeid="+place_id+"&key="+KEY, function(res) {
    var data = '';
    res.on('data', function(chunk) {
      data += chunk;
    });

    res.on('end', function() {
      data = JSON.parse(data);

      var name = data.result.name;
      var adr = data.result.formatted_address;
      var open_now = (data.result.opening_hours || {}).open_now ? '(Open now)' : '(Closed)';
      var tabs = name.length >= 24 ? '\t' : '\t\t';
      tabs += name.length <= 15 ? '\t\t' : '\t';
      tabs += name.length < 8 ? '\t' : '';

      https.get(base_distance_url+"?origins="+LAT_LNG+"&destinations="+adr+"&mode="+MODE, function(res) {
        var data = '';
        res.on('data', function(chunk) {
          data += chunk;
        });

        res.on('end', function() {
          data = JSON.parse(data);
          var distance = (data.rows[0].elements[0].distance || {}).text || '???';
          console.log(name + tabs +' ' + open_now + '\t' + distance + '\t\t' + adr);
          cb(name);
        });
      });
    });
  });
};

https.get(base_place_url + "?location="+LAT_LNG+"&radius="+RADIUS+"&types="+TYPES+"&rankBy=distance&key="+KEY, function(res) {
  var data = '';
  res.on('data', function(d) {
    data += d;
  });

  res.on('end', function() {
    data = JSON.parse(data);
    data.results.forEach(function(place) {
      var place_id = place.place_id;
      requestPlace(place_id, function(name) {/* ... */});
    });
  });
});