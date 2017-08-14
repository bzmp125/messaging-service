var Client = require('node-rest-client').Client,
    restClient = new Client(),
    base64 = require('base-64')
 
class frello {
    constructor(APP_ID, APP_SECRET) {
        if (!APP_ID || !APP_SECRET)
            throw Error('Invalid or missing Frello Credentials.')
        else {
            this.APP_ID = APP_ID;
            this.APP_SECRET = APP_SECRET
            this.baseUrl = 'http://api.frello.co.zw/v4';
        }
    }

    sendSMS(to, message, from) {
        return new Promise((resolve, reject) => {
            if (typeof from == "undefined" || !from) {
                from = null;
            }

            if (!message || !to) {
                reject({
                    error: "MISSING OR INVALID PARAMETERS"
                })
            }

            var data = {
                to,
                message,
                app_id: this.APP_ID,
                app_secret: base64.encode(this.APP_SECRET)
            }

            if (from)
                data.from = from;

            var req = restClient.post(this.baseUrl + "/messages", {
                parameters: data,
                headers: {
                    "Content-Type": "application/json"
                }
            }, d => {
                console.log('d', d)
                if (d && d.data && d.message == "MESSAGE SENT.")
                    resolve(d.data)
                else
                    resolve(false)
            }, e => {
                console.log('error sending request to Frello', e)
                reject(e)
            })

            req.on('error', e => {
                console.log('error sending message', e)
                throw new Exception(e)
            })
        })
    }

    sendSMSToList(list_id, message, from) {
        return new Promise((resolve, reject) => {
            if (typeof from == "undefined" || !from) {
                from = null;
            }

            if (!message || !list_id) {
                reject({
                    error: "MISSING OR INVALID PARAMETERS"
                })
            }

            var data = {
                message,
                app_id: this.APP_ID,
                app_secret: base64.encode(this.APP_SECRET)
            }

            if (from)
                data.from = from;
            var req = restClient.post(this.baseUrl + "/lists/${list_id}/send", {
                path: {
                    list_id
                },
                parameters: data,
                headers: {
                    "Content-Type": "application/json"
                }
            }, d => {
                console.log('d', d)
                if (d && d.data && d.message == "MESSAGE SENT TO LIST.")
                    resolve(d.data)
                else
                    resolve(false)
            }, e => {
                console.log('error sending request to Frello', e)
                reject(e)
            })

            req.on('error', e => {
                console.log('error sending message', e)
                throw new Exception(e)
            })
        })
    }

    sendTemplateSMSToList(template_Id, variables, list_id, message, from) {
        return new Promise((resolve, reject) => {
            if (typeof from == "undefined" || !from) {
                from = null;
            }

            if (!message || !list_id) {
                reject({
                    error: "MISSING OR INVALID PARAMETERS"
                })
            }

            var data = variables;
            data.list_id = list_id;
            data.message = message;
            data.app_id = this.APP_ID;
            data.app_secret = base64.encode(this.APP_SECRET);

            if (from)
                data.from = from;

            var req = restClient.post(this.baseUrl + "/templates/${template_id}", {
                path: {
                    template_id
                },
                parameters: data,
                headers: {
                    "Content-Type": "application/json"
                }
            }, d => {
                if (d && d.data && d.message == "MESSAGE SENT TO LIST.")
                    resolve(d.data);
                else
                    resolve(false);
            }, e => {
                console.log('error sending request to Frello', e)
                reject(e)
            })

            req.on('error', e => {
                console.log('error sending message', e)
                throw new Exception(e)
            })
        })
    }

    sendTemplateSMS(template_id, variables, to, message, from) {
        return new Promise((resolve, reject) => {
            if (typeof from == "undefined" || !from) {
                from = null;
            }

            if (!message || !to) {
                reject({
                    error: "MISSING OR INVALID PARAMETERS"
                })
            }

            var data = variables;
            data.to = to;
            data.message = message;
            data.app_id = this.APP_ID;
            data.app_secret = base64.encode(this.APP_SECRET);

            if (from)
                data.from = from;

            var req = restClient.post(this.baseUrl + "/templates/${template_id}", {
                path: {
                    template_id
                },
                parameters: data,
                headers: {
                    "Content-Type": "application/json"
                }
            }, d => {
                if (d && d.data && d.message == "MESSAGE SENT.")
                    resolve(d.data);
                else
                    resolve(false);
            }, e => {
                console.log('error sending request to Frello', e)
                reject(e)
            })

            req.on('error', e => {
                console.log('error sending message', e)
                throw new Exception(e)
            })
        })
    }
}

module.exports = frello