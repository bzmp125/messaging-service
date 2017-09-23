var express = require('express'),
    router = express.Router(),
    bodyParser = require('body-parser'),
    jsonParser = bodyParser.json(),
    models = require('../modules/Models'),
    //if you want to store the Push Notification data i.e the token and perhaps user_id of the user to which the token belongs to
    PushData = models.PushData,
    PushNotification = models.PushNotification,
    admin = require('firebase-admin'),
    serviceAccount = require("path_to_adminsdk_service_account_file.json"), //get this from your FCM Dashboard
    functions = require('../modules/functions'),
    allValidators = [functions.validators];

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

//to save push token etc
router.post('/push/save', jsonParser, (req, res) => {
    if (req.body.token) {
        var user_id = req.body.user_id; //or however you'd want to get your user_id
        PushData.find({
            user_id,
            token: req.body.token
        }).then(existing => {
            //if it's already saved.
            if (existing && existing.length > 0) {
                res.json(functions.return(true, "PUSH TOKEN SAVED."))
            } else {
                //then save the new data
                var data = new PushData({
                    user_id,
                    token: req.body.token
                })

                data.save().then(doc => {
                    console.log('saved doc', doc)
                    if (doc) {
                        res.json(functions.return(true, "PUSH TOKEN SAVED."))
                    } else {
                        res.json(functions.return(false, "PUSH TOKEN NOT SAVED."))
                    }
                })
            }
        })
    } else {
        res.json(functions.return(false, "MISSING OR INVALID PARAMETERS."));
    }
})

//sending the actual notification given the necessary parameters
router.post('/push/send', jsonParser, (req, res) => {
    //at the very least notification should have title,icon & body
    if (req.body.user_id && req.body.notification) {
        var user_id = req.body.user_id;
        PushData.find({
            user_id
        }).then(tokens => {
            /*
                this will find all tokens belonging to the user with given user_id, this means atleast
                one notification is sent to every device the user signed up with or accepted to receive 
                push notifications.
            */

            if (tokens.length) {
                var registrationTokens = [];
                tokens.forEach(token => {
                    if (registrationTokens.indexOf(token) == -1)
                        registrationTokens.push(token.token);
                })

                var payload = {
                    notification: req.body.notification
                }
                if (req.body.data) {
                    payload.data = req.body.data;
                }

                if (!payload.notification.icon) {
                    payload.notification.icon = 'url_default_icon'; //this default can also be set in the service worker.
                }

                if (!payload.notification.title) {
                    payload.notification.title = "Malin Notification"; //this default can also be set in the service worker.
                }

                var PushNotificationData = {
                    payload,
                    sent_by: 'descriptive_id_of_sender', //this is for accountability sake, just to know who sent the notification.
                    to: user_id
                }

                var tmp = new PushNotification(PushNotificationData);
                tmp.save().then(savedPushNotification => {
                    if (savedPushNotification) {
                        payload.notification.tag = savedPushNotification._id;
                        //sendToDevice accepts a token or [token] allowing sending to more than one device.
                        //For a more organised way of sending grouped notifications, check out FCM's documentation on Group Notifications.
                        admin.messaging().sendToDevice(registrationTokens, payload)
                            .then(function (response) {
                                // See the MessagingDevicesResponse reference documentation for
                                // the contents of response.
                                console.log("Successfully sent message:", response);
                                if (response.results && !(response.failureCount == 0 && response.successCount == 0)) {
                                    var successful = [],
                                        errored = [];
                                    var x = 0;
                                    response.results.forEach(result => {
                                        if (result.error) {
                                            errored.push({
                                                user_id,
                                                token: registrationTokens[x],
                                                error: result.error
                                            })
                                        } else {
                                            successful.push({
                                                user_id,
                                                token: registrationTokens[x]
                                            })
                                        }
                                        x++;
                                    })
                                    res.json(functions.return(true, "PUSH NOTIFICATION SENT.", {
                                        successful,
                                        errored
                                    }))

                                    if (errored.length > 0) {
                                        //Some notifications might fail because of many reasons, sometimes because the token has expired.
                                        //You might want to do some house cleaning here, i.e deleting all the tokens which have expired or revoked.
                                    }
                                } else {
                                    res.json(functions.return(true, "PUSH NOTIFICATION NOT SENT."))
                                }
                            }).catch(function (error) {
                                console.log("Error sending message:", error);
                                res.json(functions.return(false, "FAILED TO SEND PUSH NOTIFICATION."))
                            });
                    } else {
                        res.json(functions.return(false, "FAILED TO SAVE PUSH NOTIFICATION."));
                    }
                }).catch(function (error) {
                    console.log("Error saving notification:", error);
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

//This sends a notification to all user's or devices with tokens saved.
router.post('/push/send/all', jsonParser, (req, res) => {
    if (req.body.notification) {
        PushData.find().then(tokens => {

            if (tokens.length) {
                var registrationTokens = [];
                var user_ids = [];
                tokens.forEach(token => {
                    if (registrationTokens.indexOf(token) == -1) {
                        registrationTokens.push(token.token);
                        user_ids.push(token.user_id)
                    }
                })

                var payload = {
                    notification: req.body.notification
                }
                if (req.body.data) {
                    payload.data = req.body.data;
                }

                if (!payload.notification.icon) {
                    payload.notification.icon = 'https://malinapp.herokuapp.com/statics/img/logo.png';
                }

                if (!payload.notification.title) {
                    payload.notification.title = "Malin Notification";
                }

                var PushNotificationData = {
                    payload,
                    sent_by: 'descriptive_id_of_sender', //this is for accountability sake, just to know who sent the notification.
                    to: user_ids
                }

                var tmp = new PushNotification(PushNotificationData);
                tmp.save().then(savedPushNotification => {
                    if (savedPushNotification) {
                        payload.notification.tag = savedPushNotification._id.toString();
                        //now the notification has a tag.

                        admin.messaging().sendToDevice(registrationTokens, payload)
                            .then(function (response) {
                                // See the MessagingDevicesResponse reference documentation for
                                // the contents of response.
                                if (response.results && !(response.failureCount == 0 && response.successCount == 0)) {
                                    console.log("Successfully sent message:", response);
                                    var successful = [],
                                        errored = [];
                                    var x = 0;
                                    response.results.forEach(result => {
                                        if (result.error) {
                                            errored.push({
                                                token: registrationTokens[x],
                                                error: result.error
                                            })
                                        } else {
                                            successful.push({
                                                token: registrationTokens[x]
                                            })
                                        }
                                        x++;
                                    })

                                    savedPushNotification.response = {
                                        successful,
                                        errored
                                    }

                                    savedPushNotification.sent = true;
                                    savedPushNotification.save().then(savedPushNotification => {
                                        if (savedPushNotification) {
                                            res.json(functions.return(true, "PUSH NOTIFICATION SENT.", {
                                                successful,
                                                errored
                                            }));
                                        } else {
                                            res.json(functions.return(false, "PUSH NOTIFICATION NOT SENT."));
                                        }
                                    }).catch(e => {
                                        console.log('Failed to save notification', e)
                                        res.json(functions.return(false, "FAILED TO SAVE PUSH NOTIFICATION."));
                                    })
                                } else {
                                    res.json(functions.return(true, "PUSH NOTIFICATION NOT SENT."));
                                }
                            })
                            .catch(function (error) {
                                console.log("Error sending message:", error);
                                res.json(functions.return(false, "FAILED TO SEND PUSH NOTIFICATION."));
                            });
                    } else {
                        res.json(functions.return(true, "FAILED TO SAVE PUSH NOTIFICATION."))
                    }
                })
            } else {
                res.json(functions.return(false, "PUSH DATA NOT FOUND."))
            }
        })
    } else {
        res.json(functions.return(false, "MISSING OR INVALID PARAMETERS."));
    }
})

module.exports = router;