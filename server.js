
// Auth Token - You can generate your token from 
// https://<slack_name>.slack.com/services/new/bot
// var token = "...";

var express = require('express');
var LineConnect = require('./line_connect.js');
var bodyParser = require('body-parser');
var pkg = require('./package.json');
var config = require('./config/beta/configurations.json');

var http = express();
var port = config.port || pkg.config.node_port;

http.use(bodyParser.json());

LineConnect.listen(http);

http.listen(port);

module.exports = {
  http: http
};
