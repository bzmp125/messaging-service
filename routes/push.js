var express = require('express'),
    bodyParser = require('body-parser'),
    jsonParser = bodyParser.json(),
    config = require('../modules/config')
models = require('../modules/Models'),
    PushData = models.PushData,
    PromotionPars = models.PromotionPars,
    Client = require('node-rest-client').Client,
    restClient = new Client(),
    router = express.Router(),
    firebaseApiKey = process.env.FIREBASEAPIKEY,
    firebaseApiSecret = process.env.FIREBASEAPISECRET,
    firebase = require('firebase'),
    firebase.initializeApp(config.firebaseConfig),
    admin = require('firebase-admin'),
    serviceAccount = require("../config/notyfaya-firebase-adminsdk-v7jko-d90fcdbebd.json"),
    functions = require('../modules/functions'),
    allValidators = [functions.adminTokenValidator, functions.shopTokenValidator, functions.tokenValidator, functions.finalValidator]

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

function generateCode() {
    return new Promise((resolve, reject) => {
        var push_id = functions.rand(10000, 9999999);
        PushData.find({ push_id }).then(docs => {
            if (docs.length == 0) {
                resolve(code);
            } else {
                return generateCode();
            }
        }, e => {
            reject();
        })
    })
}

router.post('/push', allValidators, jsonParser, (req, res) => {
    if (req.body.token) {
        var user_id = req.app.get('user_id')
        PushData.find({ user_id, token: req.body.token }).then(existing => {
            if (existing && existing.length > 0) {
                res.json(functions.return(true, "PUSH TOKEN SAVED."))
            } else {
                //then save the new data
                var data = new PushData({
                    user_id,
                    token: req.body.token
                })

                data.save().then(doc => {
                    if (doc) {
                        res.json(functions.return(true, "PUSH DATA SAVED."))
                    } else {
                        res.json(functions.return(false, "PUSH DATA NOT SAVED."))
                    }
                    console.log('saved doc', doc)
                })
            }
        })
    } else {
        res.json(functions.return(false, "MISSING OR INVALID PARAMETERS."));
    }
})

router.post('/push/send', allValidators, jsonParser, (req, res) => {
    if (req.body.user_id && req.body.notification) {
        var user_id = req.body.user_id;
        PushData.find({ user_id }).then(tokens => {

            if (tokens.length) {
                var registrationTokens = [];
                tokens.forEach(token => {
                    registrationTokens.push(token.token);
                })

                var payload = {
                    notification: req.body.notification
                }
                if (req.body.data) {
                    payload.data = req.body.data;
                }

                admin.messaging().sendToDevice(registrationTokens, payload)
                    .then(function (response) {
                        // See the MessagingDevicesResponse reference documentation for
                        // the contents of response.
                        if(response.results && !(response.failureCount==0 && response.successCount==0)){
                            console.log("Successfully sent message:", response);
                            var successful = [],errored = [];
                            var x = 0;
                            response.results.forEach(result=>{
                                if(result.error){
                                    errored.push({user_id,token:registrationTokens[x],error:result.error})
                                }else{
                                    successful.push({user_id,token:registrationTokens[x]})
                                }
                                x++;
                            })
                            res.json(functions.return(true, "PUSH NOTIFICATION SENT.",{successful,errored}))
                        }else{
                            res.json(functions.return(true, "PUSH NOTIFICATION NOT SENT."))
                        }
                    })
                    .catch(function (error) {
                        console.log("Error sending message:", error);
                        res.json(functions.return(false, "FAILED TO SEND PUSH NOTIFICATION."))
                    });
            } else {
                res.json(functions.return(false, "PUSH DATA NOT FOUND."))
            }
        })
    } else {
        res.json(functions.return(false, "MISSING OR INVALID PARAMETERS."));
    }
})
module.exports = router;

