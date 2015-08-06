var weather = require('weather-js');


exports.getWeather = function(query, cb) {
	weather.find({search: query, degreeType: 'C'}, function(err, result) {
	  if(err || result.length === 0 || !result[0].location) {
	  	cb(null, 'cannot get weather');
	  }
	 	cb(null, JSON.stringify(result[0]));
	});
};
