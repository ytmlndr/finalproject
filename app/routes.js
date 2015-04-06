var User = require('./models/user');
var Patient = require('./models/patient');
var URL = require('url');
var loggedinuser;
GLOBAL.token; //tokenID will be here

module.exports = function(app, passport) {

    app.get('/', function(req, res) {
        if(req.session.messages == null) {
            req.session.messages = '';
        }
        console.log(req.url);
        var url_parts = URL.parse(req.url, true);
        var query = url_parts.query;
        GLOBAL.token=query.tokenID; //GETTING TOKEN FROM URL
        res.render('index', { message: req.session.messages });
    });

    app.get('/profile', ensureAuthenticated, function(req, res) {
        loggedinuser=req.user;
        res.render('profile', { user : req.user});
    });


    app.get('/register', function(req, res) {
        res.render('register', {user : req.user});
    });

    app.get('/editdetails', function(req, res) {
        res.render('editdetails', { user : req.user});
    });

    app.post('/register', function(req, res) {
        var user = new User({username: req.body.username, password: req.body.password});
        user.save(function(err) {
            if(err) {
                console.log('error while trying to save new user to db: ' + err);
                req.session.message = 'could not create user';
                return res.redirect('/');
            } else {
                console.log('user ' + user.username + ' saved');
                req.session.message = 'login with new user';
                return res.redirect('/');
            }
        });
    });

    //Michael Update
    app.post('/editdetails', function(req, res){
        if(req.body.fname != "" && req.body.lname!= "" && req.body.phone!= "" && req.body.addr!= "" && req.body.zipcode!= "" &&
            req.body.email!= "" && req.body.minutes!= "") {
            //Working
            User.update({username: loggedinuser.username}, {
                $set: {
                    f_name: req.body.fname,//the content that the user enter
                    l_name: req.body.lname
                }
            }, function (err) {
                if (err) {
                    console.log("err");
                } else {
                    console.log("User update successful");
                }
            });

            Patient.update({userID: loggedinuser.username}, {
                $set: {
                    PhoneNumber: req.body.phone,
                    Address: req.body.addr,
                    ZIP: req.body.zipcode,
                    Email: req.body.email,
                    MinutesToBeNotifyBefor: req.body.minutes
                }
            }, function (err) {
                if (err) {
                    console.log("err");
                } else {
                    console.log("Patient update successful");
                }
            });

            res.render('profile', {user: req.user});
        }
    });

    app.post('/login', function(req, res, next) {
        passport.authenticate('local-login', function(err, user, info) {
            if (err) {
                console.log('encountered error');
                return next(err);
            }
            if (!user) {
                console.log('user object is false');
                req.session.messages =  [info.message];
                return res.redirect('/');
            }
            req.logIn(user, function(err) {
                if (err) {
                    console.log('encountered error');
                    return next(err);
                }
                console.log('login successfully');
                Patient.update({userID: user.username}, {
                    $set: {
                        TokenID: GLOBAL.token //set Token
                    }
                }, function (err) {
                    if (err) {
                        console.log("err");
                    } else {
                        console.log("Token Updated");
                    }
                });
                return res.redirect('/profile');
            });
        })(req, res, next);
    });

    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

    //app.get('/css/index.css', function(req, res) {
    //    res.sendFile('/css/index.css');
    //});
    //
    //app.get('/css/profile.css', function(req, res) {
    //    res.sendFile('/css/profile.css');
    //});

    function ensureAuthenticated(req, res, next) {
        console.log('ensuring authentication');
        if (req.isAuthenticated()) {
            console.log('user authenticated');
            return next();
        }
        console.log('user is not authenticated');
        res.redirect('/login');
    }
};