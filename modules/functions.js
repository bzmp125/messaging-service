var config = require('./config');
var md5 = require('md5');
function createTokenKey(token){
    return "token-"+md5(new Buffer(token,'base64').toString());
}
function createShopRepTokenKey(token){
    return "shop-rep-token-"+md5(new Buffer(token,'base64').toString());
}
function createAdminTokenKey(token){
    return "admin-token-"+md5(new Buffer(token,'base64').toString());
}

module.exports = {
    return: function (success, message, data) {
        var returnObj = {
            success,
            message
        };
        if (typeof data !== 'undefined') returnObj.data = data;
        return returnObj;
    },
    getUserIdFromToken: function (conn, token) {
        return new Promise((resolve, reject) => {
            unocache.get(createTokenKey(token), (err,val,key)=>{
                if(err)
                    reject();
                if(val!=null){
                    resolve(val.toString());
                }else{
                    reject();
                }
            })
        })
    },
    /**
     * So here's how we are going to do authentication using middleware
     * 
     * Different callbacks can be chained but at the end there must be the final authenticationValidator() callback
     * This callback's simple responsibility is to check for authentication by either of the predecessing callbacks.
     * If the request is not authenticated by the time it reaches it, the request then fails. One important thing to
     * note is that if the request is then authenticated by one of the callbacks then every other succeeding callback
     * should just call next()
     * 
     */
    validators:[
        tokenValidator= (req, res, next) => {
            console.log('token validator')
            //if already authenticated proceed
            if(req.app.get('authenticated') && req.app.get('authenticated')==true) next();
            else{
                //if the token is not set in unocache then it can be checked from
                //setting up unocache
                let unocache = config.unocache;
                let key = createTokenKey(req.headers.token)

                unocache.get(key, function (err, value, key) {
                    if (err) {
                        res.json({ success: false, message: "AUTHENTICATION ERROR." });
                        exit;
                    }else{

                        if (value != null) {
                            req.app.set('user_id', value.toString());
                            req.app.set('authenticated', true);
                        }                     
                        next();
                    }
                });
            }

        },
        shopTokenValidator= (req, res, next) => {
            //if already authenticated proceed
            if(req.app.get('authenticated') && req.app.get('authenticated')==true) next();
            else{

                //if the token is not set in unocache then it can be checked from
                //setting up unocache
                let unocache = config.unocache;
                let key = createShopRepTokenKey(req.headers.token)

                unocache.get(key, function (err, value, key) {
                    if (err) {
                        res.json({ success: false, message: "AUTHENTICATION ERROR." });
                        exit;
                    }else{

                        if (value != null) {
                            var value = JSON.parse(value.toString());
                            req.app.set('user_id', value.user_id);
                            req.app.set('shop_uid', value.shop_uid);
                            req.app.set('authenticated', true);
                        } 
                        next();
                    }
                });
            }
        },
        adminTokenValidator= (req, res, next) => {
            //if already authenticated proceed
            if(req.app.get('authenticated') && req.app.get('authenticated')==true) next();
            else{

                //if the token is not set in unocache then it can be checked from
                //setting up unocache
                let unocache = config.unocache;
                let key = createAdminTokenKey(req.headers.token)

                unocache.get(key, function (err, value, key) {
                    if (err) {
                        res.json({ success: false, message: "AUTHENTICATION ERROR." });
                        exit;
                    }else{
                        if (value != null) {
                            req.app.set('admin_id', value.toString());
                            req.app.set('authenticated', true);
                        } 
                        next();
                    }

                });
            }
        },
        requestAuthenticator= (req,res,next)=>{
            if(req.app.get('authenticated') && req.app.get('authenticated')==true){
                next();
            }else{
                res.json(functions.return(false,"INVALID CREDENTIALS."));
            }
        }
    ]
}
