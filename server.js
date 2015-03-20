/**
 * Created by yotam on 3/20/2015.
 */
var dev = 'dev';

var express = require('express');
var http = require('http');
var socketio = require('socket.io');
var app = express();
var server = http.Server(app);
var io = socketio(server);
var port;

app.get('/', function (req, res) {
    res.end('hello');
});

io.on('connection', function(socket){
   console.log('a user connected');
});

if('dev' == dev) {
    port = 3000;
} else {
    port = process.env.port;
}

server.listen(port, function(){
    console.log('listening on port ' + port);
});

