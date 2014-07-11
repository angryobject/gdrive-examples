'use strict';

var googleapis = require('googleapis');
var request = require('request');

function upload(auth, file, callback) {

    googleapis.discover('drive', 'v2').execute(function (err, client) {
        if (err) {
            callback(err);
        } else {
            client.drive.files
                .insert({ title: file.title, mimeType: file.mime })
                .withMedia(file.mime, file.content)
                .withAuthClient(auth)
                .execute(callback);
        }
    });

}

function list(auth, callback) {

    googleapis.discover('drive', 'v2').execute(function (err, client) {
        if (err) {
            callback(err);
        } else {
            client.drive.files
                .list({q: 'trashed = false'})
                .withAuthClient(auth)
                .execute(callback);
        }
    });

}

function get(auth, fid, callback) {

    googleapis.discover('drive', 'v2').execute(function (err, client) {
        if (err) {
            callback(err);
        } else {
            client.drive.files
                .get({fileId: fid})
                .withAuthClient(auth)
                .execute(callback);
        }
    });

}

function download(auth, fid, callback) {

    get(auth, fid, function (err, fileMeta) {
        if (err) {
            callback(err);
        } else {
            var stream = request({
                uri: fileMeta.downloadUrl,
                headers: {
                    authorization: auth.credentials.token_type + ' ' + auth.credentials.access_token
                }
            });

            callback(null, stream);

            // or return Buffer:
            // var chunks = [];
            // stream.on('data', function (chunk) {
            //     chunks.push(chunk);
            // });
            // stream.on('end', function () {
            //     callback(null, new Buffer.concat(chunks));
            // });
            // stream.on('error', function (err) {
            //     callback(err);
            // });
        }
    });

}

module.exports.upload = upload;
module.exports.list = list;
module.exports.get = get;
module.exports.download = download;
