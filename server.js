/**
 * Created by yotam on 3/20/2015.
 */
var express = require('express');
var http = require('http');
var socketio = require('socket.io');
var app = express();
var server = http.Server(app);
var io = socketio(server);
var port = process.env.port;

app.get('/', function (req, res) {
    res.end('hello');
});

io.on('connection', function(socket){
   console.log('a user connected');
});

server.listen(process.env.PORT || 5000, function(){
    console.log('listening on port ' + port);
});

