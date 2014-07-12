'use strict';

var googleapis = require('googleapis');
var request = require('request');

function discover(callback) {
    googleapis.discover('drive', 'v2').execute(callback);
}

function upload(auth, meta, content, callback) {

    discover(function (err, client) {
        if (err) {
            callback(err);
        } else {
            client.drive.files
                .insert(meta)
                .withMedia(meta.mimeType, content)
                .withAuthClient(auth)
                .execute(callback);
        }
    });

}

function list(auth, callback) {

    discover(function (err, client) {
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

    discover(function (err, client) {
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

function share(auth, fid, permissions, callback) {

    discover(function (err, client) {
        if (err) {
            callback(err);
        } else {
            client.drive.permissions
                .insert({fileId: fid}, permissions)
                .withAuthClient(auth)
                .execute(callback);
        }
    });

}

function update(auth, meta, body, callback) {

    discover(function (err, client) {
        if (err) {
            callback(err);
        } else {
            var update = client.drive.files
                .update({fileId: meta.id}, meta)
                .withAuthClient(auth);

            if (body) {
                update.withMedia(meta.mimeType, body);
            }

            update.execute(callback);
        }
    });

}

function erase(auth, fid, callback) {

    discover(function (err, client) {
        if (err) {
            callback(err);
        } else {
            client.drive.files
                .delete({fileId: fid})
                .withAuthClient(auth)
                .execute(callback);
        }
    });

}

function trash(auth, fid, callback) {

    discover(function (err, client) {
        if (err) {
            callback(err);
        } else {
            client.drive.files
                .trash({fileId: fid})
                .withAuthClient(auth)
                .execute(callback);
        }
    });

}

function untrash(auth, fid, callback) {

    discover(function (err, client) {
        if (err) {
            callback(err);
        } else {
            client.drive.files
                .untrash({fileId: fid})
                .withAuthClient(auth)
                .execute(callback);
        }
    });

}

module.exports.upload = upload;
module.exports.list = list;
module.exports.get = get;
module.exports.download = download;
module.exports.share = share;
module.exports.update = update;
module.exports.erase = erase;
module.exports.trash = trash;
module.exports.untrash = untrash;
