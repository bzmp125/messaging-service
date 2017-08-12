var express = require('express'),
    bodyParser = require('body-parser'),
    jsonParser = bodyParser.json(),
    config = require('../modules/config'),
    models = require('../modules/Models'),
    PromotionPars = models.PromotionPars,
    Client = require('node-rest-client').Client,
    restClient = new Client(),
    router = express.Router(),
    functions = require('../modules/functions'),
    SMS = models.SMS,
    Email = models.Email,
    EmailQueue = models.EmailQueue,
    Frello = require('../modules/frello'),
    frello = new Frello(config.frello.appId, config.frello.appSecret),
    allValidators = [functions.adminTokenValidator, functions.shopTokenValidator, functions.tokenValidator, functions.finalValidator]
    SparkPost = require('sparkpost'),
    sparkPostClient = new SparkPost(),
    emailSendingLimit = config.emailSendingLimit

function generateCode() {
    return new Promise((resolve, reject) => {
        var transaction_id = functions.rand(10000, 9999999);
        Promotion.find({ transaction_id }).then(docs => {
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
        EmailQueue.find({sent:false}).limit(100).then(emails => {
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
                resolve({done:true})
            }
        })
    })
}

router.post('/emails', allValidators, jsonParser, (req, res) => {
    if (req.body.to && req.body.message && req.body.from && req.body.subject) {
        var message = req.body.message;
        var to = req.body.to;
        var from = (req.body.from) ? req.body.from : null;
        var content = {
            from:req.body.from,
            subject: req.body.subject,
            html: req.body.message
        }
        if (req.body.headers) {
            content.headers = req.body.headers;
        }

        var allRecipients = req.body.to.split(",").map(email => { return { address: email } });

        if (allRecipients.length > emailSendingLimit) {
            var noOfBatches = parseInt(allRecipients.length / maxSendingEmails) + 1;

            //now we then break allRecipients into batches of length maxSendingEmails
            //start is the starting break point for each iteration.

            var start = 0;
            var EmailQueuesToBeSaved = [];

            for (var i = 1; i <= noOfBatches; i++) {
                var recipients = allRecipients.splice(start, maxSendingEmails);

                if (recipients.length > 0) {
                    EmailQueuesToBeSaved.push({ content, recipients })
                }
            }
            if (EmailQueuesToBeSaved.length > 0) {
                EmailQueue.insertMany(EmailQueuesToBeSaved).then(docs => {
                    if (docs.length > 0) {
                        var queueIds = docs.map(doc => { return doc._id })
                        res.json(functions.return(false, "EMAIL QUEUED.", { queueIds }))
                        //set the dequeue process into motion.
                        dequeue();
                    }
                })
            }else{
                res.json(functions.return(false,"UNABLE TO SEND EMAIL."))
            }
        }else{
            sendEmail(content,allRecipients).then(d=>{
                if(d.results && d.results.total_accepted_recipients>0){
                    var sent_by = req.app.get(req.app.get('user_type')+"_id");
                    var EmailToSave = {
                        from,
                        to,
                        text:message,
                        sent_by,
                        email_id:d.results.id,
                        sent:true
                    };
                    var data = new Email(EmailToSave);
                    data.save().then(doc=>{
                        if(doc){
                            res.json(functions.return(true,"EMAIL SENT.",doc))
                        }else{
                            res.json(functions.return(false,"EMAIL NOT SAVED."))
                        }
                    }).catch(e=>{
                        console.log('Exception when saving sent email.',e)
                        res.json(functions.return(false,"FAILED TO SAVE EMAIL."))
                    })

                }else{
                    res.json(functions.return(false,"EMAIL NOT SENT."))
                }
            }).catch(e=>{
                console.log('Exception',e);
                res.json(functions.return(false,"FAILED TO SEND EMAIL."))
            })
        }

    } else {
        res.json(functions.return(false, "MISSING OR INVALID PARAMETERS."));
    }
})

router.get('/emails', allValidators, jsonParser, (req, res) => {
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

router.get('/emails/:emailId', allValidators, jsonParser, (req, res) => {
    Email.findOne({_id:req.params.emailId}).then(email => {
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

router.get('/users/:userId/emails', allValidators, (req, res) => {
    var limit = (req.query.limit) ? req.query.limit : config.maxEmailRetrievalLimit;
    Email.find({ user_id: req.params.userId }).limit(limit).then(emails => {
        if (emails.length > 0) {
            res.json(functions.return(true, "USER EMAILS FOUND.", {
                count: emails.length,
                emails
            }))
        } else {
            res.json(functions.return(false, "USER EMAILS NOT FOUND."));
        }
    }).catch(e => {
        console.log('Exception whilst getting Emails', e);
        res.json(functions.return(false, "FAILED TO GET USER EMAILS.")).status(500);
    })
})


module.exports = router;

