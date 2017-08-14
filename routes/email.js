var express = require('express'),
    bodyParser = require('body-parser'),
    jsonParser = bodyParser.json(),
    config = require('../modules/config'),
    models = require('../modules/Models'),
    router = express.Router(),
    functions = require('../modules/functions'),
    Email = models.Email,
    EmailQueue = models.EmailQueue,
    SparkPost = require('sparkpost'),
    sparkPostClient = new SparkPost(),
    emailSendingLimit = config.emailSendingLimit

function sendEmail(content, recipients) {
    return new Promise((resolve, reject) => {
        sparkPostClient.transmissions.send({
                content,
                recipients
            })
            .then(data => {
                resolve(data)
            })
            .catch(err => {
                reject(err)
            });
    })
}

function dequeue() {
    return new Promise((resolve, reject) => {
        EmailQueue.find({
            sent: false
        }).limit(100).then(emails => {
            if (emails.length > 0) {
                emails.forEach(email => {
                    sendEmail(email.content, email.recipients).then(d => {
                        if (d.results && d.results.total_accepted_recipients > 0) {
                            email.sent = true;
                            email.save();
                        }
                    })
                })
            } else {
                resolve({
                    done: true
                })
            }
        })
    })
}

router.post('/emails', jsonParser, (req, res) => {
    if (req.body.to && req.body.message && req.body.from && req.body.subject) {
        var message = req.body.message; //plain text or html to be sent in the email.
        var to = req.body.to; // comma separated string of email addresses
        var from = (req.body.from) ? req.body.from : null;
        var content = {
            from: from,
            subject: req.body.subject,
            html: message
        }

        var allRecipients = req.body.to.split(",").map(email => {
            return {
                address: email
            }
        }); //Sparkpost recipient should be [ { address: '<EMAIL ADDRESS HERE>' } ]

        /*
            SparkPost has a recommended sending limit which is 2000, but you can configure it to anything 
            less as an env variable EMAIL_SENDING_LIMIT. This is then set in config.js

            The emailSendingLimit is the one used to send the emails in batches if the number of emails
            specified in req.body.to is greater than the limit. If the number of email addresses is
            more than the limit, then the emails have be queued and the dequeue as the emails are being sent.
            This greatly improves on the efficiency of the code and also following the SparkPost Sending Guidelines
            found at https://www.sparkpost.com/docs/tech-resources/smtp-rest-api-performance/
         */

        if (allRecipients.length > emailSendingLimit) {
            var noOfBatches = parseInt(allRecipients.length / emailSendingLimit) + 1;

            //now we then break allRecipients into batches of length emailSendingLimit
            //start is the starting break point for each iteration.

            var start = 0;
            var EmailQueuesToBeSaved = [];

            for (var i = 1; i <= noOfBatches; i++) {
                var recipients = allRecipients.splice(start, emailSendingLimit);

                if (recipients.length > 0) {
                    EmailQueuesToBeSaved.push({
                        content,
                        recipients // for this i-th batch
                    })
                }
            }
            if (EmailQueuesToBeSaved.length > 0) {
                EmailQueue.insertMany(EmailQueuesToBeSaved).then(docs => {
                    if (docs.length > 0) {
                        var queueIds = docs.map(doc => {
                            return doc._id
                        })
                        res.json(functions.return(false, "EMAIL QUEUED.", {
                            queueIds
                        }))
                        //set the dequeue process into motion.
                        dequeue();
                    }
                })
            } else {
                res.json(functions.return(false, "UNABLE TO SEND EMAIL."))
            }
        } else {
            sendEmail(content, allRecipients).then(d => {
                if (d.results && d.results.total_accepted_recipients > 0) {

                    var EmailToSave = {
                        from,
                        to,
                        text: message,
                        email_id: d.results.id,
                        sent: true
                    };

                    var data = new Email(EmailToSave);
                    data.save().then(doc => {
                        if (doc) {
                            res.json(functions.return(true, "EMAIL SENT.", doc))
                        } else {
                            res.json(functions.return(false, "EMAIL NOT SAVED."))
                        }
                    }).catch(e => {
                        console.log('Exception when saving sent email.', e)
                        res.json(functions.return(false, "FAILED TO SAVE EMAIL."))
                    })
                } else {
                    res.json(functions.return(false, "EMAIL NOT SENT."))
                }
            }).catch(e => {
                console.log('Exception', e);
                res.json(functions.return(false, "FAILED TO SEND EMAIL."))
            })
        }
    } else {
        res.json(functions.return(false, "MISSING OR INVALID PARAMETERS."));
    }
})

router.get('/emails', jsonParser, (req, res) => {
    var limit = (req.query.limit) ? req.query.limit : config.maxEmailRetrivalLimit;

    Email.find().limit(limit).then(emails => {
        if (emails.length > 0) {
            res.json(functions.return(true, "EMAILS FOUND.", {
                count: emails.length,
                emails
            }))
        } else {
            res.json(functions.return(false, "EMAILS NOT FOUND."))
        }
    }).catch(e => {
        console.log('Exception whilst getting Emails', e);
        res.json(functions.return(false, "FAILED TO GET EMAILS.")).status(500);
    })
})

router.get('/emails/:emailId', (req, res) => {
    Email.findOne({
        _id: req.params.emailId
    }).then(email => {
        if (email) {
            res.json(functions.return(true, "EMAIL FOUND.", email))
        } else {
            res.json(functions.return(false, "EMAILS NOT FOUND."))
        }
    }).catch(e => {
        console.log('Exception whilst getting Emails', e);
        res.json(functions.return(false, "FAILED TO GET EMAILS.")).status(500);
    })
})

module.exports = router;