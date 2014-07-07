'use strict';

var connect = require('connect');
var http = require('http');
var app = connect();

require('./middleware')(app);
require('./routes')(app);

http.createServer(app).listen(process.env.PORT || 8080);
