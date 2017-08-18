var http = require('http'),
    express = require('express'),
    app = express(),
    server = http.createServer(app),
    cors = require('cors')

var corsOptions = {
    origin: '*',
    methods: 'GET, POST, PUT, DELETE, OPTIONS',
    allowedHeaders: 'token, content-type'
}
app.use(cors(corsOptions));

//you can replace MongoDB with any other Database of your choice
var mongoose = require('mongoose');
mongoose.connect(process.env.MESSAGEDB_URI, { useMongoClient:true }); //MESSAGEDB_URI is the mongodb uri for the database
var db = mongoose.connection;

db.on('error', console.error.bind(console, 'Connection Error : '));
db.once('open', function () {
    console.log('DB Connection ok!');
});

mongoose.Promise = global.Promise;

// The server should start listening
server.listen(process.env.PORT);
console.log('listening on port ', process.env.PORT)

// Register the index route of your app that returns the HTML file
app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

app.use('/api', require('./routes/sms'));
app.use('/api', require('./routes/email'));
//app.use('/api', require('./routes/push'));  //Support for Push Messages coming soon.
