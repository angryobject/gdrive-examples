'use strict';

var fs = require('fs');
var oauth = require('../oauth');
var gdrive = require('../gdrive');

module.exports = function (app) {

	// setup authorization callback route
	oauth.route(app);

	// drive apis
	app.use('/drive', function (req, res) {

		if (req.method === 'POST') {
			oauth.authenticate(req,res, function (err, res, auth) {
				if (err) {
					res.end('Could not authenticate.')
				} else {
					var title = req.body.fileName;
					var content = req.body.fileContent;

					gdrive.upload(auth, {
						title: title,
						mime: 'text/plain',
						content: content,
					}, function (err, result) {
						if (err) {
							res.end('Could not upload file.');
						} else {
							res.end(JSON.stringify(result, null, '\t'));
						}
					});
				}
			});
		} else {
			res.redirect(req.headers.referer || '/');
		}

	});


	// 404
	app.use(function (req, res) {

		fs.readFile(__dirname + '/../public/404.html', function (err, file) {
			if (err) {
				res.end('Server encountered an error.')
			} else {
				res.end(file);
			}
		});

	});

}
