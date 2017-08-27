var prodDb = {}, prodAlgolia = {};
if (process.env.CLEARDB_DATABASE_URL) {
    var match = process.env.CLEARDB_DATABASE_URL.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+)\/(.+)\?/);
    prodDb = {
        host: match[3],
        user: match[1],
        password: match[2],
        database: match[4],
        connectionLimit: 10
    }
}
var localDb = {
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'malin'
}

//algolia
///var algolia  = (process.env=='')

var frello = {
    appId: process.env.FRELLO_APP_ID,
    appSecret: process.env.FRELLO_APP_SECRET
}

var firebaseConfig = {
    apiKey: "<FIREBASE-API-KEY>",
    authDomain: "<FIREBASE-AUTH-DOMAIN>"
}

var maxEmailRetrievalLimit = process.env.MAXEMAILRETRIEVALLIMIT
var emailSendingLimit = process.env.EMAIL_SENDING_LIMIT;

module.exports = {
    frello,
    firebaseConfig,
    maxEmailRetrievalLimit,
    emailSendingLimit
}
