var http = require('http'),
    express = require('express'),
    app = express(),
    config = require('./modules/config'),
    functions = require('./modules/functions'),
    server = http.createServer(app),
    io = require('socket.io').listen(server),
    assert = require('assert'),
    memjs = require('memjs'),
    memjsclient = memjs.Client.create(),
    md5 = require('md5'),
    base64 = require('base-64'),
    cors = require('cors'),
    Client = require('node-rest-client').Client,
    restClient = new Client();


var corsOptions = {
    origin: '*',
    methods: 'GET, POST, PUT, DELETE, OPTIONS',
    allowedHeaders: 'token, content-type'
}
app.use(cors(corsOptions));

/* Search times here on the backend */
var searchStart = 0;
var searchEnd = 0;

var mongoose = require('mongoose');
mongoose.connect(process.env.MESSAGEDB_URI);
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
    console.log("Homepage");
    res.sendFile(__dirname + '/index.html');
});

// Expose the node_modules folder as static resources (to access socket.io.js in the browser)
app.use('/static', express.static('node_modules'));
app.use('/api', require('./routes/sms'));
app.use('/api', require('./routes/email'));
app.use('/api', require('./routes/push'));



var from; //which part of the application the search came from
// Handle connection
io.on('connection', function (socket) {
    var connectionId = socket.id;

    io.sockets.connected[connectionId].emit('search_connected', { connectionId });
    console.log("Connected succesfully to the socket ...", connectionId);

    socket.on('connection-id', data => {
        io.sockets.connected[connectionId].emit('search_connected', { connectionId });
    })

    socket.on('search', function (data) {

    });
});
