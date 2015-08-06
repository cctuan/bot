var YouTube = require('youtube-node');

var youTube = new YouTube();

youTube.setKey('AIzaSyB1OOSpTREs85WUMvIgJvLTZKye4BVsoFU');
var youtubeUrl = 'https://www.youtube.com/watch?v=';

exports.getYoutube = function(query, cb) {
	console.log(query);
	youTube.search(query, 2, function(error, result) {
	  if (error || !result.items || result.items.length === 0) {
	    cb(null, 'cannot find out anything');
	  }
	  else {
	    cb(null, youtubeUrl + result.items[0].id.videoId);
	  }
	});
};
