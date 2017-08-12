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

if (process.env.ALGO_APPID) {
    prodAlgolia = {
        applicationId: process.env.ALGO_APPID,
        apiKey: process.env.ALGO_SECRET
    }
}
var localAlgolia = {
    applicationId: 'IJFHVMZUMU',
    apiKey: 'b2f62d5a1d70a10dc198ab6ee65712b3'
}

if (process.env.UNOCACHE_SERVERS) {
    var prodUnocache = {
        servers: process.env.UNOCACHE_SERVERS,
        username: process.env.UNOCACHE_USERNAME,
        password: process.env.UNOCACHE_PASSWORD
    }
} else {
    var localUnocache = {
        servers: '127.0.0.1',
        username: '',
        password: ''
    }
}

var db = (process.env.CLEARDB_DATABASE_URL) ? prodDb : localDb;
var algolia = {
    applicationId: process.env.ALGO_APPID,
    apiKey: process.env.ALGO_SECRET
};
var unocacheConfig = (process.env.UNOCACHE_SERVERS) ? prodUnocache : localUnocache;

var memjs = require('memjs');
var unocache = memjs.Client.create(unocacheConfig.servers, {
    username: unocacheConfig.username,
    password: unocacheConfig.password
});

//algolia
///var algolia  = (process.env=='')

var frello = {
    appId: process.env.FRELLO_APP_ID,
    appSecret: process.env.FRELLO_APP_SECRET
}
var firebaseConfig = {
    apiKey: "AIzaSyBCI3J90-Ba19hkHmEdsWRFSvOCYPHvbN4",
    authDomain: "notyfaya.firebaseapp.com"
}

var unsecuredRoutes = ['/api/products/search'];
var maxEmailRetrievalLimit = process.env.MAXEMAILRETRIEVALLIMIT
var emailSendingLimit = process.env.EMAIL_SENDING_LIMIT;
var accountsAPIURL = process.env.ACCOUNTSAPI_URL;
module.exports = {
    db,
    algolia,
    unsecuredRoutes,
    unocache,
    frello,
    firebaseConfig,
    maxEmailRetrievalLimit,
    emailSendingLimit,
    accountsAPIURL
}
