'use strict';

var serveStatic = require('serve-static');
var bodyParser = require('body-parser');
var session = require('express-session');
var query = require('./query');
var redirect = require('./redirect');
var oauth = require('../oauth');

module.exports = function (app) {

	app.use(serveStatic('public'));
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(session({
        secret: 'skateboard cat',
        resave: true,
        saveUninitialized: true
    }));
    app.use(query());
    app.use(redirect());
    app.use(oauth.middleware());

};
