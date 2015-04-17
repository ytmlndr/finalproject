var User = require('./models/user');
var Patient = require('./models/patient');
var Doctor = require('./models/doctor');
var URL = require('url');
var loggedinuser;
GLOBAL.token; //tokenID will be here
GLOBAL.Doctors=[];

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

    app.get('/searchdoctor', function(req, res) {
        res.render('searchdoctor', { Doctors : {}});
    });

    //Michael Update 17/4
    app.post('/searchdoctor',function(req,res){
        GLOBAL.Doctors=[];
        num=0;// this to count callback
        num2=0// this to count how many doctors didnt fit to first and last name
        Doctor.find({"MedicalField": new RegExp(req.body.hiddenMF, 'i'),"Languages":new RegExp(req.body.hiddenLAN,'i')},
            function(err,doc){
                num++;
                if(err){
                    console.log(err);
                }else{
                    for(x in doc){
                        User.findOne({userID: parseInt(doc[x].userID,10),"f_name": new RegExp(req.body.fname, 'i'),"l_name": new RegExp(req.body.lname, 'i')}
                            , function (err, use){
                                num++;
                                if(!use){
                                    num2++;
                                }
                                else if(err){
                                    console.log(err);
                                }else{
                                    Doctor.findOne({userID: parseInt(use.userID,10)},function(err,d){
                                        num++;
                                        if(!d){
                                            console.log("no Doc Found");
                                        }else{
                                            GLOBAL.Doctors.push({
                                                fname: use.f_name,
                                                lname: use.l_name,
                                                field: d.MedicalField.toString(),
                                                clinic: d.ClinicAddress.city+", "+ d.ClinicAddress.street,
                                                phone: d.PhoneNumber,
                                                lan: d.Languages.toString()
                                            });
                                            //This is the only way i know to make render after all callbacks are finished
                                            if(num == 1+ doc.length + doc.length - num2){
                                                res.render("searchdoctor", {"Doctors": GLOBAL.Doctors});
                                            }
                                        }
                                    });
                                }
                        })
                    }
                }
            });
    });

    app.post('/register', function(req, res) {
        var user = new User({userID: parseInt(req.body.username,10), password: req.body.password});
        user.save(function(err) {
            if(err) {
                console.log('error while trying to save new user to db: ' + err);
                req.session.message = 'could not create user';
                return res.redirect('/');
            } else {
                console.log('user ' + user.userID + ' saved');
                req.session.message = 'login with new user';
                return res.redirect('/');
            }
        });
    });

    //Michael Update
    app.post('/editdetails', function(req, res){
        if(req.body.city!= "",req.body.street!= "" && req.body.zipcode!= "" && req.body.phone!= "" &&
            req.body.email!= "" && req.body.minutes!= "") {
            //Working

            Patient.update({userID: parseInt(loggedinuser._doc.userID,10)}, {
                $set: {
                    "Address.city": req.body.city,
                    "Address.street": req.body.street,
                    "Address.ZIP": req.body.zipcode,
                    "PhoneNumber": req.body.phone,
                    "Email": req.body.email,
                    "MinutesToBeNotifyBefor": req.body.minutes
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
                Patient.update({userID: user.userID}, {
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