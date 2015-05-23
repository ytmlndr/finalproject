var user = require('./models/user');
var patient = require('./models/patient');
var doctor = require('./models/doctor');
var Appointment = require('./models/Appointment');
var medicalFields = require('./models/medicalfield');
var languages = require('./models/languages');
var URL = require('url');
var async = require('async');
var datejs = require('datejs'); // DO NOT DELETE THIS
var loggedUser;
var token; //tokenID will be here

module.exports = function (app, passport) {

    app.get('/', function (req, res) {
        if (req.session.messages == null) {
            req.session.messages = '';
        }
        console.log(req.url);
        var url_parts = URL.parse(req.url, true);
        var query = url_parts.query;
        token = query.tokenID; //GETTING TOKEN FROM URL
        res.render('index', {message: req.session.messages});
    });

    app.get('/profile', ensureAuthenticated, function (req, res) {
        loggedUser = req.user;
        var query = Appointment.find({});
        console.log('profile for user ' + loggedUser._doc.userID);
        query.where('patientID').equals(parseInt(loggedUser._doc.userID)).exec(function(err,appointments) {
            res.render('profile', {user: req.user, appointments:appointments});
        });
    });

    app.get('/doctorprofile', ensureAuthenticated, function (req, res) {
        loggedUser = req.user;
        res.render('doctorprofile', {user: req.user});
    });

    app.get('/doctorSchedule', function (req, res) {
        appo = [];
        Appointment.find({doctorID: parseInt(loggedUser._doc.userID, 10)}, function (err, ap) {
            if (err) {
                console.log(err);
            }
            else {
                for (x in ap) {
                    appo.push({
                        pid: ap[x].patientID,
                        date: ap[x].appointment.date,
                        day: ap[x].appointment.day,
                        stime: ap[x].appointment.startTime,
                        etime: ap[x].appointment.endTime
                    })
                }
                res.render('doctorSchedule', {
                    fname: loggedUser.f_name,
                    lname: loggedUser.l_name,
                    appointmemts: appo
                });
            }
        });
    });

    app.get('/register', function (req, res) {
        res.render('register', {user: req.user});
    });

    app.get('/editdetails', function (req, res) {
        res.render('editdetails', {user: req.user});
    });

    app.get('/doctoreditdetails', function (req, res) {
        res.render('doctoreditdetails', {user: req.user});
    });

    app.get('/searchdoctor', function (req, res) {
        async.waterfall([
            function (callback) {
                languages.find({}, function (err, docs) {
                    callback(null, docs);
                });
            },
            function (langs, callback) {
                medicalFields.find({}, function (err, mfs) {
                    callback(null, mfs, langs);
                });
            }
        ], function (error, mfs, langs) {
            if (error) {
                res.render("searchdoctor");
            }
            res.render("searchdoctor", {"doctors": {}, "mfs": mfs, "langs": langs});
        });
    });

    app.post('/searchdoctor', function (req, res) {
        async.waterfall([
            // function to get all languages from db
            function (callback) {
                languages.find({}, function (err, docs) {
                    callback(null, docs);
                });
            },
            // function to get all medical fields from db
            function (langs, callback) {
                medicalFields.find({}, function (err, docs) {
                    callback(null, langs, docs);
                });
            },
            // function to get all users from db with first and last name filtering
            function (langs, mfs, callback) {
                user.find({
                    "f_name": new RegExp(req.body.fname, 'i'),
                    "l_name": new RegExp(req.body.lname, 'i')
                }, function (err, docs) {
                    callback(null, docs, langs, mfs);
                });
            },
            // function to get all doctors from db with filtering
            function (users, langsToView, mfsToView, callback) {
                var query = doctor.find({});
                var userIds = [];
                var doctors = [];
                var updateIds = [];

                // generating array of userIDs for query
                users.forEach(function (user) {
                    userIds.push(user.userID);
                });

                // filtering doctors by userIDs
                console.log("filtering with " + userIds);
                query.where('userID').in(userIds);

                // filtering doctors by medical fields
                if (req.body.mfs) {
                    var mfs = [];
                    if(req.body.mfs instanceof Array) {
                        req.body.mfs.forEach(function(mf) {
                           mfs.push(mf);
                        });
                    } else {
                        mfs.push(req.body.mfs);
                    }
                    console.log("filtering with " + mfs);
                    query.where('MedicalField').in(mfs);
                }

                // filtering doctors by languages
                if (req.body.langs) {
                    var langs = [];
                    if(req.body.langs instanceof Array) {
                        req.body.langs.forEach(function(lang) {
                            langs.push(lang);
                        });
                    } else {
                        langs.push(req.body.langs);
                    }
                    console.log("filtering with " + langs);
                    query.where('Languages').in(langs);
                }

                if(req.body.days) {
                    var days = [];
                    if(req.body.days instanceof Array) {
                        req.body.days.forEach(function(day) {
                           days.push(day);
                        });
                    } else {
                        days.push(req.body.days);
                    }
                    console.log("filtering with " + days);
                    query.where('WorkDay.day').in(days);
                }

                // executing query
                query.exec(function (err, docs) {
                    // searching doctor in Users collection to retrieve user data
                    if(docs) {
                        docs.forEach(function (doc) {
                            for (var i = 0; i < users.length; i++) {
                                if (users[i].userID == doc.userID) {
                                    doctors.push({
                                        "docVals": doc,
                                        "userVals": users[i]
                                    });
                                }
                            }
                        });
                        console.log("doctors.length = " + doctors.length);
                        callback(null, doctors, mfsToView, langsToView);
                    }
                    else {
                        console.log(err);
                        callback(null, {}, mfsToView, langsToView);
                    }
                });
            }
        ], function (error, doctors, mfs, langs) {
            if (error) {
                res.render("searchdoctor", {"doctors": {}, "mfs": mfs, "langs": langs});
            }
            res.render("searchdoctor", {"doctors": doctors, "mfs": mfs, "langs": langs});
        });
    });

    app.post('/register', function (req, res) {
        var user = new user({userID: parseInt(req.body.username, 10), password: req.body.password});
        user.save(function (err) {
            if (err) {
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

    app.post('/doctoreditdetails', function (req, res) {
        if (req.body.city != "" && req.body.street != "" && req.body.phone != "" && req.body.minutes != "") {
            doctor.update({userID: parseInt(loggedUser._doc.userID, 10)}, {
                $set: {
                    "ClinicAddress.city": req.body.city,
                    "ClinicAddress.street": req.body.street,
                    "PhoneNumber": req.body.phone,
                    "appointmentDuration": req.body.duration
                }
            }, function (err) {
                if (err) {
                    console.log("err");
                } else {
                    console.log("doctor update successful");
                }
            });

            res.render('doctorprofile', {user: req.user});
        }
    });

    app.post('/editdetails', function (req, res) {
        if (req.body.city != "" && req.body.street != "" && req.body.zipcode != "" && req.body.phone != "" &&
            req.body.email != "" && req.body.minutes != "") {
            patient.update({userID: parseInt(loggedUser._doc.userID, 10)}, {
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
                    console.log("patient update successful");
                }
            });

            res.render('profile', {user: req.user});
        }
    });

    app.post('/scheduleAppointment', function (req, res) {
        console.log('inside scheduleAppointment');
        doctor.findOne({}).where('userID').equals(parseInt(req.body.userID)).exec(function(err,doctor) {
            if(!err) {
                console.log('inside exec callback');
                var appointment = new Appointment();
                appointment.patientID = parseInt(loggedUser._doc.userID);
                appointment.doctorID = parseInt(req.body.userID);
                appointment.date = req.body.date;
                appointment.day = req.body.day;
                appointment.startTime = req.body.start;
                appointment.endTime = Date.parseExact(req.body.start,"hh:mm").addMinutes(doctor.appointmentDuration).toString("HH:mm");
                appointment.save(function(err) {
                    console.log('inside save callback');
                    if(err) {
                        console.log(err);
                    } else {
                       console.log('Appointment scheduled');
                       console.log(appointment);
                       res.send({redirect:'/profile'});
                   }
                });
            } else {
                console.log(err);
            }
        });
    });

    app.post('/login', function (req, res, next) {
        passport.authenticate('local-login', function (err, user, info) {
            if (err) {
                console.log('encountered error');
                return next(err);
            }
            if (!user) {
                console.log('user object is false');
                req.session.messages = [info.message];
                return res.redirect('/');
            }
            req.logIn(user, function (err) {
                if (err) {
                    console.log('encountered error');
                    return next(err);
                }
                console.log('login successfully');
                if (user.IsDoctor) {
                    return res.redirect('/doctorprofile');
                } else {
                    patient.update({userID: user.userID}, {
                        $set: {
                            TokenID: token //set Token
                        }
                    }, function (err) {
                        if (err) {
                            console.log("err");
                        } else {
                            console.log("Token Updated");
                        }
                    });
                    return res.redirect('/profile');
                }
            });
        })(req, res, next);
    });

    app.get('/logout', function (req, res) {
        req.logout();
        res.redirect('/');
    });

    app.get('/doctorAvaApp', function (req, res) {
        async.waterfall([
                function(callback) {
                    var url_parts = URL.parse(req.url, true);
                    var query = url_parts.query;
                    doctor.findOne({}).where('userID',parseInt(query.userID)).exec(function (err, doc) {
                        callback(null,doc,parseInt(query.userID));
                    });
                },
                function (doctor, userID,callback) {
                    var availableApps = [];
                    for (var i = 0; i < doctor.WorkDay.length; i++) {
                        var j = new Date();
                        var k = new Date();
                        var hourStart = parseInt(doctor.WorkDay[i].startTime.split(':')[0]);
                        var mintStart = parseInt(doctor.WorkDay[i].startTime.split(':')[1]);
                        var hourEnd = parseInt(doctor.WorkDay[i].endTime.split(':')[0]);
                        var mintEnd = parseInt(doctor.WorkDay[i].endTime.split(':')[1]);
                        var day;
                        var diff;
                        j.at({hour: hourStart, minute: mintStart});
                        k.at({hour: hourEnd, minute: mintEnd});
                        switch (doctor.WorkDay[i].day) {
                            case "Sunday":
                                day = 0;
                                break;
                            case "Monday":
                                day = 1;
                                break;
                            case "Tuesday":
                                day = 2;
                                break;
                            case "Wednesday":
                                day = 3;
                                break;
                            case "Thursday":
                                day = 4;
                                break;
                            case "Friday":
                                day = 5;
                                break;
                        }
                        if (j.getDay() <= day) {
                            diff = day - j.getDay();
                        }
                        else {
                            diff = 7 - (j.getDay() - day);
                        }
                        j.addDays(diff);
                        k.addDays(diff);
                        while (j.isBefore(k)) {
                            availableApps.push({
                                date: j.toString("dd/MM/yyyy"),
                                day: doctor.WorkDay[i].day,
                                start: j.toString("HH:mm"),
                                end: j.addMinutes(doctor.appointmentDuration).toString("HH:mm"),
                                dateObj: j
                            });
                        }
                    } // workdays FOR loop
                    availableApps.sort(function(a,b) {
                       if(a.dateObj.isBefore(b.dateObj)) {
                           return -1;
                       } else if(a.dateObj.isAfter(b.dateObj)) {
                           return 1;
                       } else if(Date.parseExact(a.start,"HH:mm").isBefore(Date.parseExact(b.start,"HH:mm"))) {
                           return -1;
                       } else if(Date.parseExact(a.start,"HH:mm").isAfter(Date.parseExact(b.start,"HH:mm"))) {
                           return 1;
                       } else {
                           return 0;
                       }
                    });
                    user.findOne({}).where('userID').equals(userID).exec(function (err, user) {
                        callback(null,availableApps,{userVals:user,docVals:doctor});
                    });
                }
            ], function(err, availableApps,doctor) {
                if(!err) {
                    console.log("going to render");
                    res.render('doctorAvaApp', { doctor: doctor ,appointments: availableApps });
                }
            }
        );
    });

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