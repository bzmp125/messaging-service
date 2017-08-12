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
    Frello = require('../modules/frello'),
    frello = new Frello(config.frello.appId, config.frello.appSecret),
    allValidators = [functions.adminTokenValidator, functions.shopTokenValidator, functions.tokenValidator, functions.finalValidator]

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

router.post('/sms', allValidators, jsonParser, (req, res) => {
    if (req.body.to && req.body.message) {
        var message = req.body.message;
        var to = req.body.to;
        var from = (req.body.from) ? req.body.from : null;
        frello.sendSMS(to, message, from).then(sent => {
            var smsToSave = {
                message,
                to,
                from
            }

            if (sent && sent.message_id) {
                res.json(functions.return(true, "MESSAGE SENT."))
                smsToSave.message_id = sent.message_id
                smsToSave.sent = true
            }
            else {
                res.json(functions.return(false, "MESSAGE NOT SENT."))
                smsToSave.sent = false;
            }

            var sms = new SMS(smsToSave);
            sms.save().then(doc => {
                console.log('saved sms', doc)
            })
        }, e => {
            console.log('Exception when sending message.', e)
            res.json(functions.return(false, "FAILED TO SEND MESSAGE."));
        })
    } else {
        res.json(functions.return(false, "MISSING OR INVALID PARAMETERS."));
    }
})

router.post('/sms/lists/:listId', allValidators, jsonParser, (req, res) => {
    if (req.body.message) {
        var from = (req.body.from) ? req.body.from : null;

        frello.sendSMSToList(req.params.listId, req.body.message, from).then(sent => {
            if (sent) res.json(functions.return(true, "MESSAGE SENT TO LIST."));
            else res.json(functions.return(false, "MESSAGE NOT SENT TO LIST."));
        }, e => {
            console.log('Exception when sending message.', e)
            res.json(functions.return(false, "FAILED TO SEND MESSAGE TO LIST."));
        })
    } else {
        res.json(functions.return(false, "MISSING OR INVALID PARAMETERS."));
    }
})

router.post('/sms/templates/:templateId/list', allValidators, jsonParser, (req, res) => {
    if (req.body.message && req.body.list_id && req.body.variables) {
        var from = (req.body.from) ? req.body.from : null;

        frello.sendTemplateSMSToList(req.params.templateId, req.body.variables, req.body.list_id, req.body.message, from).then(sent => {
            if (sent) res.json(functions.return(true, "MESSAGE SENT TO LIST."));
            else res.json(functions.return(false, "MESSAGE NOT SENT TO LIST."));
        }, e => {
            console.log('Exception when sending message.', e)
            res.json(functions.return(false, "FAILED TO SEND MESSAGE TO LIST."));
        })
    } else {
        res.json(functions.return(false, "MISSING OR INVALID PARAMETERS."));
    }
})
//this one sends to individual number(s) not an entire list
router.post('/sms/templates/:templateId', allValidators, jsonParser, (req, res) => {
    if (req.body.message && req.body.to && req.body.variables) {
        var from = (req.body.from) ? req.body.from : null;

        frello.sendTemplateSMS(req.params.templateId, req.body.variables, req.body.to, req.body.message, from).then(sent => {
            if (sent) res.json(functions.return(true, "MESSAGE SENT."));
            else res.json(functions.return(false, "MESSAGE NOT SENT."));
        }, e => {
            console.log('Exception when sending message.', e)
            res.json(functions.return(false, "FAILED TO SEND MESSAGE."));
        })
    } else {
        res.json(functions.return(false, "MISSING OR INVALID PARAMETERS."));
    }
})

module.exports = router;

