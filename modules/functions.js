var config = require('./config');
var md5 = require('md5');
function createTokenKey(token) {
    return "token-" + md5(new Buffer(token, 'base64').toString());
}

function createShopTokenKey(token) {
    return "shop-token-" + md5(new Buffer(token, 'base64').toString());
}

var Return = function (success, message, data) {
    var returnObj = {
        success,
        message
    };
    if (typeof data !== 'undefined') returnObj.data = data;
    return returnObj;
}

module.exports = {
    return: Return,
    getUserIdFromToken: function (conn, token) {
        return new Promise((resolve, reject) => {
            unocache.get(createTokenKey(token), (err, val, key) => {
                if (err)
                    reject();
                if (val != null) {
                    resolve(val.toString());
                } else {
                    reject();
                }
            })
        })
    },
    tokenValidator: (req, res, next) => {

        if (req.app.get('authenticated') && req.app.get('authenticated') == true) {
            next();
        } else {
            //avoiding checking for token on unsecuredRoutes
            var url = req.url.split('?')[0];

            //removing trailing slash
            if (url[url.length - 1] == "/") {
                url = url.slice(0, url.length - 1);
            }

            if (config.unsecuredRoutes.indexOf(url) == -1) {
                //if the token is not set in unocache then it can be checked from
                //setting up unocache

                if (req.headers.token==null) {
                    res.json({ success: false, message: "MISSING OR INVALID CREDENTIALS." })
                }
                let unocache = config.unocache;
                let key = createTokenKey(req.headers.token)
                var request = restClient.get(config.accountsAPIURL + "/token/auth?token=" + req.headers.token, {}, function (d) {
                    if (d && d.data && d.message == "TOKEN VERIFIED.") {
                        if (d.data.admin && d.data.admin.id != "undefined") {
                            req.app.set('user_type', 'admin');
                            req.app.set('user_id', d.data.admin.id);
                        }
                        if (d.data.shop_representative && d.data.shop_representative.id != "undefined") {
                            req.app.set('user_type', 'representative');
                            req.app.set('representative_id', d.data.shop_representative.id);
                        }
                        if (d.data.user && d.data.user.id != "undefined") {
                            req.app.set('user_type', 'user');
                            req.app.set('user_id', d.data.user.id);
                        }

                        req.app.set('authenticated', true)
                    } else {
                        req.app.set('authenticated', false)
                    }
                    next();
                }, function (e) {
                    res.json({ success: false, message: "AUTHENTICATION ERROR." });
                })

                request.on('error', function (error) {
                    console.log(error)
                })
                unocache.get(key, function (err, value, key) {
                    if (err) {
                    }

                    if (value != null) {
                    } else {
                    }
                });
            } else {
                next();
            }
        }
    },
    originValidator: (req, res, next) => {
        //check whether request is coming from the right place.
        next()
    },
    shopTokenValidator: (req, res, next) => {
        if (req.app.get('authenticated') && req.app.get('authenticated') == true) {
            next()
        } else {
            if (req.headers.token==null) {
                res.json({ success: false, message: "MISSING OR INVALID CREDENTIALS." })
            }
            let unocache = config.unocache;
            let key = createShopTokenKey(req.headers.token)
            var request = restClient.get(config.accountsAPIURL + "/token/auth?token=" + req.headers.token, {}, function (d) {
                console.log('accounts url', config.accountsAPIURL)
                console.log('verifying the token', d)
                if (d && d.data && d.message == "TOKEN VERIFIED." && d.data.shop_representative && d.data.shop_representative.id) {
                    req.app.set('user_type', 'representative');
                    req.app.set('representative_id', d.data.shop_representative.id);
                    req.app.set('authenticated', true)
                } else {
                    req.app.set('authenticated', false)
                }
                next();
            }, function (e) {
                res.json({ success: false, message: "AUTHENTICATION ERROR." });
            })

            request.on('error', function (error) {
                console.log(error)
            })
            unocache.get(key, function (err, value, key) {
                if (err) {
                }

                if (value != null) {
                } else {
                }
            });
        }
    },
    adminTokenValidator: (req, res, next) => {
        if (req.app.get('authenticated') && req.app.get('authenticated') == true) {
            next();
        } else {
            if (req.headers.token==null) {
                res.json({ success: false, message: "MISSING OR INVALID CREDENTIALS." })
            }
            let unocache = config.unocache;
            let key = createShopTokenKey(req.headers.token)
            var request = restClient.get(config.accountsAPIURL + "/token/auth?token=" + req.headers.token, {}, function (d) {
                console.log('auth d', d)
                if (d && d.data && d.message == "TOKEN VERIFIED." && d.data.admin && d.data.admin.id) {
                    req.app.set('user_type', 'admin');
                    req.app.set('admin_id', d.data.admin.id);
                    req.app.set('authenticated', true)
                } else {
                    req.app.set('authenticated', false)
                }
                next();
            }, function (e) {
                res.json({ success: false, message: "AUTHENTICATION ERROR." });
            })

            request.on('error', function (error) {
                console.log(error)
            })
            unocache.get(key, function (err, value, key) {
                if (err) {
                }

                if (value != null) {
                } else {
                }
            });
        }
    },
    userTokenValidator: (req, res, next) => {
        if (req.app.get('authenticated') && req.app.get('authenticated') == true) {
            next();
        } else {
            if (!req.headers.token) {
                res.json({ success: false, message: "MISSING OR INVALID CREDENTIALS." })
            }
            let unocache = config.unocache;
            let key = createShopTokenKey(req.headers.token)
            var request = restClient.get(config.accountsAPIURL + "/token/auth?token=" + req.headers.token, {}, function (d) {
                if (d && d.data && d.message == "TOKEN VERIFIED." && d.data.user && d.data.user.id) {
                    req.app.set('user_type', 'user');
                    req.app.set('user_id', d.data.user.id);
                    req.app.set('authenticated', true);
                } else {
                    req.app.set('authenticated', false)
                }
                next();
            }, function (e) {
                res.json({ success: false, message: "AUTHENTICATION ERROR." });
            })

            request.on('error', function (error) {
                console.log(error)
            })
            unocache.get(key, function (err, value, key) {
                if (err) {
                }

                if (value != null) {
                } else {
                }
            });
        }
    },
    finalValidator(req, res, next) {
        if (req.app.get('authenticated') && req.app.get('authenticated') == true) {
            next();
        } else {
            res.json(Return(false, "MISSING OR INVALID CREDENTIALS."))
        }
    }
}
