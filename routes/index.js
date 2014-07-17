'use strict';

var fs = require('fs');
var oauth = require('../oauth');
var gdrive = require('../gdrive');

module.exports = function (app) {

	// setup authorization callback route
	oauth.route(app);

	// drive apis
	app.use('/drive', function (req, res) {

		function upload(res, auth) {
            var meta = {
                title: req.body.fileName,
                mimeType: 'text/plain'
            };
            var content = req.body.fileContent;

            if (req.body.createFolder) {
                meta.mimeType = 'application/vnd.google-apps.folder';
            }

            gdrive.upload(auth, meta, content, function (err, result) {
                if (err) {
                    res.end('Could not upload file.');
                } else {
                    res.end(JSON.stringify(result, null, '\t'));
                }
            });
        }

        function update(res, auth) {
            var meta = {
                id: req.body.fileId,
                mimeType: 'text/plain',
                title: req.body.fileName || null
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

        function remove(res, auth) {
            var methods = ['trash', 'untrash', 'erase'];
            var method = methods.indexOf(req.body.action) > -1 ? req.body.action : null;

            if (!method) {
                res.end('Unknown action.');
            } else {
                gdrive[method](auth, req.body.fileId, function (err, result) {
                    if (err) {
                        res.end('Could not ' + method + ' file.');
                    } else {
                        if (method === 'erase') {
                            res.end('File was successfully deleted.')
                        } else {
                            res.end(JSON.stringify(result, null, '\t'));
                        }

                    }
                });
            }
        }

        function list(res, auth) {
            gdrive.list(auth, null, function (err, result) {
                if (err) {
                    res.end('Could not list files.');
                } else {
                    res.end(JSON.stringify(result.items, null, '\t'));
                }
            });
        }

        function get(res, auth) {
            gdrive.get(auth, req.query.fileId, function (err, result) {
                if (err) {
                    res.end('Could not retrieve file data.');
                } else {
                    res.end(JSON.stringify(result, null, '\t'));
                }
            });
        }

        oauth.authenticate(req, res, function (err, res, auth) {
            if (err) {
                res.end('Could not authenticate.')
            } else {
                if (req.method === 'POST') {
                    if (req.body.hasOwnProperty('removeFile')) {
                        remove(res, auth);
                    } else {
                        if (req.body.fileId) {
                            update(res, auth);
                        } else {
                            upload(res, auth);
                        }
                    }
                } else {
                	if (req.query.fileId) {
                		get(res, auth);
                	} else {
                		list(res, auth);
                	}
                }
            }
        });

	});

	// download file
	app.use('/download', function (req, res) {

		if (req.query.fileId) {
			oauth.authenticate(req, res, function (err, res, auth) {
	            if (err) {
	                res.end('Could not authenticate.');
	            } else {
	               gdrive.download(auth, req.query.fileId, function (err, result) {
		                if (err) {
		                    res.end('Could not download the file.');
		                } else {
		                    result.pipe(res);
		                }
		            });
	            }
	        });
		} else {
			res.end('No fileId specified.');
		}

	});

    // share file
    app.use('/share', function (req, res) {

        var fid = req.query.fileId;
        var permissions = {
            type: req.query.type,
            role: req.query.role,
            value: req.query.value
        };

        if (fid) {
            oauth.authenticate(req, res, function (err, res, auth) {
                if (err) {
                    res.end('Could not authenticate.');
                } else {
                   gdrive.share(auth, fid, permissions, function (err, result) {
                        if (err) {
                            res.end('Could not share the file.');
                        } else {
                            res.end(JSON.stringify(result, null, '\t'));
                        }
                    });
                }
            });
        } else {
            res.end('No fileId specified.');
        }

    });

    // custom file properties
    app.use('/properties', function (req, res) {

        // Udating, delting, getting property by key are
        // analogous to the same operations on files
        // and not present here.

        // Btw, to update a property you can just set it again
        // with a different value.

        function list(res, auth) {
            gdrive.listProperties(auth, fid, function (err, result) {
                if (err) {
                    res.end('Could not retrieve custom file properties.');
                } else {
                    res.end(JSON.stringify(result, null, '\t'));
                }
            });
        }

        function set(res, auth) {
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
        }

        function get(res, auth) {
            gdrive.getProperty(auth, fid, req.query.key, function (err, result) {
                if (err) {
                    res.end('Could not get custom property.');
                } else {
                    res.end(JSON.stringify(result, null, '\t'));
                }
            });
        }

        var fid = req.query.fileId || req.body.fileId;

        if (fid) {
            oauth.authenticate(req, res, function (err, res, auth) {
                if (err) {
                    res.end('Could not authenticate.');
                } else {
                    if (req.method === 'POST') {
                        set(res, auth);
                    } else {
                        if (req.query.key) {
                            get(res, auth);
                        } else {
                            list(res, auth);
                        }
                    }
                }
            });
        } else {
            res.end('No fileId specified.');
        }

    });

    // move file to folder & list contents of folder
    app.use('/folder', function (req, res) {

        var folderId = req.body.folderId || req.query.folderId;
        var fileId = req.body.fileId;

        oauth.authenticate(req, res, function (err, res, auth) {
            if (err) {
                res.end('Could not authenticate.');
            } else {
                if (fileId && folderId) {
                    // move file to folder
                    var meta = {
                        id: fileId,
                        // File cat have multiple parents,
                        // i.e. be in multiple folders
                        parents: [{
                            id: folderId
                        }]
                    };

                    gdrive.update(auth, meta, null, function (err, result) {
                        if (err) {
                            res.end('Could not move the file.');
                        } else {
                            res.end(JSON.stringify(result, null, '\t'));
                        }
                    });
                } else if(folderId) {
                    // list folder contents

                    // one way, but we get limited data back:
                    // gdrive.folderContents(auth, folderId, null, function (err, result) {
                    //     if (err) {
                    //         res.end('Could get folder contents.');
                    //     } else {
                    //         res.end(JSON.stringify(result.items, null, '\t'));
                    //     }
                    // });

                    // the other way via search query, get full metadata back
                    gdrive.list(auth, '"' + folderId + '" in parents and trashed = false', function (err, result) {
                        if (err) {
                            res.end('Could not get folder contents.');
                        } else {
                            res.end(JSON.stringify(result.items, null, '\t'));
                        }
                    });
                } else {
                    // list folders
                    gdrive.list(auth, 'mimeType = "application/vnd.google-apps.folder" and trashed = false', function (err, result) {
                        if (err) {
                            res.end('Could not get folder contents.');
                        } else {
                            res.end(JSON.stringify(result.items, null, '\t'));
                        }
                    });
                }
            }
        });

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
