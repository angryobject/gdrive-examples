'use strict';

var qs = require('qs');

function query(req, res, next) {

	req.query = qs.parse(req._parsedUrl.query);
	next();

}

module.exports = function () {

	return query;

};
