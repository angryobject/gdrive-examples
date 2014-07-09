'use strict';

var googleapis = require('googleapis');

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

module.exports.upload = upload;
module.exports.list = list;
