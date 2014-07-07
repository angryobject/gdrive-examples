'use strict';

function redirect(req, res, next) {

	res.redirect = function (url) {
		this.writeHead(302, {
		  'Location': url
		});
		this.end();
	};

	next();

}

module.exports = function () {

	return redirect;

}
