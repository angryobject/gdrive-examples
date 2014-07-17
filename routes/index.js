'use strict';

var fs = require('fs');
var oauth = require('../oauth');
var gdrive = require('../gdrive');

function authenticate(req, res, cb) {
    oauth.authenticate(req, res, function (err, res, auth) {
        if (err) {
            res.end('Could not authenticate.');
        } else {
            cb(res, auth);
        }
    });
}

module.exports = function (app) {

	// setup authorization callback route
	oauth.route(app);

    // remove files
    app.use('/drive/files/remove', function (req, res) {

        if (req.body.fileId) {
            authenticate(req, res, function (res, auth) {
                var methods = ['trash', 'untrash', 'erase'];
                var method = methods.indexOf(req.body.action) > -1 ? req.body.action : null;

                if (!method) {
                    res.end('Bad request. Unknown command.');
                } else {
                    gdrive[method](auth, req.body.fileId, function (err, result) {
                        if (err) {
                            res.end('Could not ' + method + ' file.');
                        } else {
                            if (method === 'erase') {
                                res.end('File was successfully deleted.');
                            } else {
                                res.end(JSON.stringify(result, null, '\t'));
                            }
                        }
                    });
                }
            });
        } else {
            res.end('Bad request. No fileId specified.');
        }

    });

    // upload, update, list & get files
    app.use('/drive/files', function (req, res) {

        authenticate(req, res, function (res, auth) {
            if (req.method === 'POST') {
                if (req.body.fileId) {
                    update(res, auth);
                } else {
                    upload(res, auth);
                }
            } else {
                if (req.query.fileId) {
                    get(res, auth);
                } else {
                    list(res, auth);
                }
            }
        });

        function update(res, auth) {
            var meta = {
                id: req.body.fileId,
                mimeType: 'text/plain',
                title: req.body.fileName
            };
            var content = req.body.fileContent;

            gdrive.update(auth, meta, content, function (err, result) {
                if (err) {
                    res.end('Could not update file.');
                } else {
                    res.end(JSON.stringify(result, null, '\t'));
                }
            });
        }

        function upload(res, auth) {
            var meta = {
                title: req.body.fileName,
                mimeType: 'text/plain'
            };
            var content = req.body.fileContent;

            gdrive.upload(auth, meta, content, function (err, result) {
                if (err) {
                    res.end('Could not upload file.');
                } else {
                    res.end(JSON.stringify(result, null, '\t'));
                }
            });
        }

        function get(res, auth) {
            gdrive.get(auth, req.query.fileId, function (err, result) {
                if (err) {
                    res.end('Could not get file.');
                } else {
                    res.end(JSON.stringify(result, null, '\t'));
                }
            });
        }

        function list(res, auth) {
            gdrive.list(auth, 'mimeType != "application/vnd.google-apps.folder" and trashed = false', function (err, result) {
                if (err) {
                    res.end('Could not list files.');
                } else {
                    res.end(JSON.stringify(result.items, null, '\t'));
                }
            });
        }

    });

    // move file to folder
    app.use('/drive/folders/move', function (req, res) {

        if (req.body.fileId && req.body.folderId) {
            var meta = {
                id: req.body.fileId,
                // File cat have multiple parents,
                // i.e. be in multiple folders.
                parents: [{
                    id: req.body.folderId
                }]
            };

            // Here we redeclare parents property, so if the file
            // already was in a folder, it'll be deleted from there
            // and moved to the new folder. A better way would be to
            // load file's metadata and append our folder to existing
            // parents array, if it exists.

            authenticate(req, res, function (res, auth) {
                gdrive.update(auth, meta, null, function (err, result) {
                    if (err) {
                        res.end('Could not move file.');
                    } else {
                        res.end(JSON.stringify(result, null, '\t'));
                    }
                });
            });
        } else {
            res.end('Bad request. No fileId and/or folderId specified.');
        }

    });

    // list contents of folder, list folders
    app.use('/drive/folders', function (req, res) {

        authenticate(req, res, function (res, auth) {
            if(req.query.folderId) {
                folderContents(res, auth);
            } else {
                list(res, auth);
            }
        });

        function folderContents(res, auth) {
            // One way, but we get limited data back:
            // gdrive.folderContents(auth, req.query.folderId, null, function (err, result) {
            //     if (err) {
            //         res.end('Could get folder contents.');
            //     } else {
            //         res.end(JSON.stringify(result.items, null, '\t'));
            //     }
            // });

            // The other way via search query, returns full metadata back:
            gdrive.list(auth, '"' + req.query.folderId + '" in parents and trashed = false', function (err, result) {
                if (err) {
                    res.end('Could not get folder contents.');
                } else {
                    res.end(JSON.stringify(result, null, '\t'));
                }
            });
        }

        function list(res, auth) {
            gdrive.list(auth, 'mimeType = "application/vnd.google-apps.folder" and trashed = false', function (err, result) {
                if (err) {
                    res.end('Could not list folders.');
                } else {
                    res.end(JSON.stringify(result, null, '\t'));
                }
            });
        }

    });

    // custom file properties
    app.use('/drive/properties', function (req, res) {

        // Udating & delting properties are
        // analogous to the same operations on files
        // and not present here.

        // Btw, to update a property you can just set it again
        // with a different value.
        // TODO: check if this is true for files as well

        var fid = req.query.fileId || req.body.fileId;

        if (fid) {
            authenticate(req, res, function (res, auth) {
                if (req.method === 'POST') {
                    set(res, auth);
                } else {
                    if (req.query.key) {
                        get(res, auth);
                    } else {
                        list(res, auth);
                    }
                }
            });
        } else {
            res.end('Bad request. No fileId specified.');
        }

        function set(res, auth) {
            if (req.body.key) {
                var property = {
                    key: req.body.key,
                    value: req.body.value
                };

                gdrive.setProperty(auth, fid, property, function (err, result) {
                    if (err) {
                        res.end('Could not set custom property on file.');
                    } else {
                        res.end(JSON.stringify(result, null, '\t'));
                    }
                });
            } else {
                res.end('Bad request. No property key specified.');
            }
        }

        function get(res, auth) {
            gdrive.getProperty(auth, fid, req.query.key, function (err, result) {
                if (err) {
                    res.end('Could not get property.');
                } else {
                    res.end(JSON.stringify(result, null, '\t'));
                }
            });
        }

        function list(res, auth) {
            gdrive.listProperties(auth, fid, function (err, result) {
                if (err) {
                    res.end('Could not get properties.');
                } else {
                    res.end(JSON.stringify(result, null, '\t'));
                }
            });
        }

    });

    // download file
    app.use('/drive/download', function (req, res) {

        if (req.query.fileId) {
            authenticate(req, res, function (res, auth) {
               gdrive.download(auth, req.query.fileId, function (err, result) {
                    if (err) {
                        res.end('Could not download file.');
                    } else {
                        result.pipe(res);
                    }
                });
            });
        } else {
            res.end('Bad request. No fileId specified.');
        }

    });

    // share file
    app.use('/drive/share', function (req, res) {

        if (req.body.fileId) {
            var permissions = {
                type: req.body.type,
                role: req.body.role,
                value: req.body.value
            };

            authenticate(req, res, function (res, auth) {
               gdrive.share(auth, req.body.fileId, permissions, function (err, result) {
                    if (err) {
                        res.end('Could not share file.');
                    } else {
                        res.end(JSON.stringify(result, null, '\t'));
                    }
                });
            });
        } else {
            res.end('Bad request. No fileId specified.');
        }

    });

    // list files on drive with with search param
    app.use('/drive', function (req, res) {
        authenticate(req, res, function (res, auth) {
            gdrive.list(auth, req.query.q, function (err, result) {
                if (err) {
                    res.end('Could not list files.');
                } else {
                    res.end(JSON.stringify(result, null, '\t'));
                }
            });
        });
    });

	// 404
	app.use(function (req, res) {

		fs.readFile(__dirname + '/../public/404.html', function (err, file) {
			if (err) {
				res.end('Server encountered an error.');
			} else {
				res.end(file);
			}
		});

	});

};
