'use strict';

var request = require('request');
var CryptoJS = require("crypto-js");
var config = require('./config/beta/configurations.json');

var superscript = require("superscript");
var mongoose = require("mongoose");
mongoose.connect('mongodb://localhost:27017/line');

// slack-client provides auth and sugar around dealing with the RealTime API.
//var Slack = require("slack-client");

var debug = require('debug')("Line bot");
var facts = require("sfacts");
var factSystem = facts.explore("botfacts");
var TopicSystem = require("superscript/lib/topics/index")(mongoose, factSystem);

var options = {};
options['factSystem'] = factSystem;
options['mongoose'] = mongoose;

var BotInstance;

function listen(app) {
	// Main bot entry point
	TopicSystem.importerFile('./data.json', function(){
	  new superscript(options, function(err, botInstance){
	  	if (err) {
	  		console.log('bot instance cannot be initialized');
	  		return;
	  	}
	  	console.log('bot is initialized');
	  	app.post('/events', verifySigniture, startParseContent);
	  	BotInstance = botInstance;
	  });
	});
}

function verifySigniture(req, res, next) {
	var channelSignature = req.get('X-LINE-ChannelSignature');
	var sha256 = CryptoJS.HmacSHA256(JSON.stringify(req.body),
		config.channelSecret);
	var base64encoded = CryptoJS.enc.Base64.stringify(sha256);
	if (base64encoded === channelSignature) {
		next();
	} else {
		res.status(401).end();
	}
}

function startParseContent(req, res) {
	var results = req.body.result;
	if (!results || !results.length) {
		// ask for resend
		res.status(300).end();
		return;
	}
	// assume we can parse the data, early send 200 response to server
	res.status(200).end();
	results.forEach(resplyFromResult);
}

function resplyFromResult(result) {
	var eventType = result.eventType;
	switch (eventType) {
		case '138311609000106303': // receiving messages
			replyFromMessage(result.content);
			break;
		case '138311609100106403': // receiving opeations
			replyFromOperation(result.content);
			break;
		default:
			console.log('get unknown type');
			return undefined;
			break;
	}
}

function replyFromOperation(content) {
	if (!content.params || content.params.length === 0) {
		return;
	}
	switch (content.opType) {
		case 4: // added as a friend
			content.params.forEach(replyFromAddedFriendOperation);
			break;
		case 8: // bocked
			// blocked ??
			break;
	}
}

function replyFromAddedFriendOperation(mid) {
	if (!mid) {
		return;
	}
	replyText(mid, 'Welcome', function() {});
}

function replyFromMessage(content) {
	if (!content.from) {
		return;
	}
	// TODO: implement filter
	if (content.contentType !== 1) {
		return;
	}
	var mid = content.from;
	var text = content.text;
	console.log('receiving from ' + mid + ' :' + text);
	BotInstance.reply(mid, text, function(err, reply) {
		if (reply.replyId === undefined) {
			return;
		}
		replyText(mid, reply.string, function() {});
	});
}

function replyText(mid, text, callback) {
	replyToLine(mid, {
		contentType: 1,
		toType: 1,
		text: text
	}, callback);
}

function replyToLine(who, content, callback) {
	var data = {
		to: [who],
		toChannel: config.eventToChannelId,
		eventType: config.eventType,
		content: content
	};

	request({
		method: 'POST',
		url: config.channelUrl + '/v1/events',
		headers: {
			'Content-Type': 'application/json',
			'X-LINE-ChannelToken': config.channelToken
		},
		json: data
	}, function(err, res, body) {
		if (err) {
			callback && callback(err);
		} else {
			callback && callback();
		}
	});
}


module.exports = {
	listen: listen
};

