'use strict';

var googleapis = require('googleapis');
var request = require('request');

module.exports.discover = function discover(cbError, cbSuccess) {
    if (arguments.length === 1) {
        cbSuccess = function (client) {
            cbError(null, client);
        };
    }

    googleapis.discover('drive', 'v2').execute(function (err, client) {
        if (err) {
            cbError(err);
        } else {
            cbSuccess(client);
        }
    });

};

module.exports.upload = function upload(auth, meta, body, cb) {

    this.discover(cb, function (client) {
        var insert = client.drive.files
            .insert(meta)
            .withAuthClient(auth);

        if (body) {
            insert.withMedia(meta.mimeType, body);
        }

        insert.execute(cb);
    });

};

module.exports.list = function list(auth, q, cb) {

    this.discover(cb, function (client) {
        client.drive.files
            .list({q: q || 'trashed = false'})
            .withAuthClient(auth)
            .execute(cb);
    });

};

module.exports.get = function get(auth, fid, cb) {

    this.discover(cb, function (client) {
        client.drive.files
            .get({fileId: fid})
            .withAuthClient(auth)
            .execute(cb);
    });

};

module.exports.update = function update(auth, meta, body, cb) {

    this.discover(cb, function (client) {
        var update = client.drive.files
            .update({fileId: meta.id}, meta)
            .withAuthClient(auth);

        if (body) {
            update.withMedia(meta.mimeType, body);
        }

        update.execute(cb);
    });

};

module.exports.erase = function erase(auth, fid, cb) {

    this.discover(cb, function (client) {
        client.drive.files
            .delete({fileId: fid})
            .withAuthClient(auth)
            .execute(cb);
    });

};

module.exports.trash = function trash(auth, fid, cb) {

    this.discover(cb, function (client) {
        client.drive.files
            .trash({fileId: fid})
            .withAuthClient(auth)
            .execute(cb);
    });

};

module.exports.untrash = function untrash(auth, fid, cb) {

    this.discover(cb, function (client) {
        client.drive.files
            .untrash({fileId: fid})
            .withAuthClient(auth)
            .execute(cb);
    });

};

module.exports.setProperty = function setProperty(auth, fid, property, cb) {

    this.discover(cb, function (client) {
        client.drive.properties
            .insert({fileId: fid}, property)
            .withAuthClient(auth)
            .execute(cb);
    });

};

module.exports.getProperty = function getProperty(auth, fid, key, cb) {

    this.discover(cb, function (client) {
        client.drive.properties
            .get({fileId: fid, propertyKey: key})
            .withAuthClient(auth)
            .execute(cb);
    });

};

module.exports.listProperties = function listProperties(auth, fid, cb) {

    this.discover(cb, function (client) {
        client.drive.properties
            .list({fileId: fid})
            .withAuthClient(auth)
            .execute(cb);
    });

};

module.exports.folderContents = function folderContents(auth, fid, q, cb) {

    this.discover(cb, function (client) {
        client.drive.children
            .list({folderId: fid, q: q || 'trashed = false'})
            .withAuthClient(auth)
            .execute(cb);
    });

};

module.exports.download = function download(auth, fid, cb) {

    this.get(auth, fid, function (err, meta) {
        if (err) { cb(err); } else {
            if (meta.downloadUrl) {
                var stream = request({
                    uri: meta.downloadUrl,
                    headers: {
                        authorization: auth.credentials.token_type + ' ' + auth.credentials.access_token
                    }
                });

                // return stream
                cb(null, stream);

                // or return Buffer:
                // var chunks = [];
                // stream.on('data', function (chunk) {
                //     chunks.push(chunk);
                // });
                // stream.on('end', function () {
                //     cb(null, new Buffer.concat(chunks));
                // });
                // stream.on('error', function (err) {
                //     cb(err);
                // });
            } else {
                cb(new Error('Can\'t donwload file.'));
            }
        }
    });

};

module.exports.share = function share(auth, fid, permissions, cb) {

    this.discover(cb, function (client) {
        client.drive.permissions
            .insert({fileId: fid}, permissions)
            .withAuthClient(auth)
            .execute(cb);
    });

};
