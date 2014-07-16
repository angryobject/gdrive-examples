'use strict';

var CLIENT_ID = process.env.CLIENT_ID;
var CLIENT_SECRET = process.env.CLIENT_SECRET;
var REDIRECT_URL = process.env.REDIRECT_URL;
var SCOPES = [
    'https://www.googleapis.com/auth/drive.file',
    // to store app-specific files that user should not see:
    // 'https://www.googleapis.com/auth/drive.appdata'
];

var googleapis = require('googleapis');
var auth = new googleapis.OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL);
var cuid = require('cuid');

var pageCallbacks = {};

function authenticate(req, res, callback) {

    var session = req.session;
    var auth = new googleapis.OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL);
    var uid;

    if (session._authError) {
        session._authError = false;
        callback(new Error('Authentication error.'), res);
    } else if (!session._credentials) {
        uid = cuid();
        session._authRedirect = req.originalUrl + '?authcbid=' + uid;

        pageCallbacks[uid] = {
            sessionId: req.sessionID,
            originalUrl: session._authRedirect,
            callback: callback
        };

        res.redirect(auth.generateAuthUrl({
          scope: SCOPES.join(" ")
        }));
    } else {
        auth.credentials = session._credentials;
        callback(null, res, auth);
    }

}

function authResultCallback(req, res, next) {

    var session = req.session;
    var redirect = session._authRedirect || '/';
    var code = req.query.code;

    auth.getToken(code, function (err, tokens) {
        if (err) {
            session._authError = true;
        } else {
            session._credentials = tokens;
        }

        res.redirect(redirect);
    });

}

function authPageCallback(req, res, next) {

    var uid = req.query.authcbid;
    var sessionId = req.sessionID;
    var originalUrl = req.originalUrl;
    var callback;

    if (pageCallbacks.hasOwnProperty(uid) &&
        pageCallbacks[uid].sessionId === sessionId &&
        pageCallbacks[uid].originalUrl === originalUrl &&
        typeof pageCallbacks[uid].callback === 'function') {

        callback = pageCallbacks[uid].callback;
        delete pageCallbacks[uid];

        authenticate(req, res, callback);
    } else {
        next();
    }

}

module.exports.route = function (app) {

    app.use(require('url').parse(REDIRECT_URL).path, authResultCallback);

};

module.exports.middleware = function () {

    return authPageCallback;

};

module.exports.authenticate = authenticate;
