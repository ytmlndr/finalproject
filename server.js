var express         = require('express');
var path            = require('path');
var logger          = require('morgan');
var cookieParser    = require('cookie-parser');
var session         = require('express-session');
var bodyParser      = require('body-parser');
var passport        = require('passport');
var User            = require('./app/models/user');

require('./config/passport')(passport);

var app = express();

app.use(logger('dev'));
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(session({secret: 'yotamlenderkfiryahalommichaelabramov', resave: true, saveUninitialized: false}));

app.use(express.static(path.join(__dirname, '/views/css')));
console.log('serving static files at ' + path.join(__dirname, '/views/css'));
app.use(passport.initialize());
app.use(passport.session());

require('./app/routes')(app, passport);








var pkg = require('./package.json');
app.set('port', process.env.PORT || 3000);
var server = app.listen(app.get('port'), function(){
   console.log(pkg.name, 'listening on port', server.address().port);
});