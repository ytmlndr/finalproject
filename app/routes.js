var user = require('./models/user');
var patient = require('./models/patient');
var doctor = require('./models/doctor');
var Appointment = require('./models/Appointment');
var medicalFields = require('./models/medicalfield');
var languages = require('./models/languages');
var URL = require('url');
var async = require('async');
var datejs = require('datejs'); // DO NOT DELETE THIS
var utils = require('./functionsUtils');
var delayNotification = require('../config/delayNotifierComponent');
GLOBAL.token; //tokenID will be here

module.exports = function (app, passport) {

    app.get('/', function (req, res) {
        if (req.session.messages == null) {
            req.session.messages = '';
        }
        console.log(req.url);
        var url_parts = URL.parse(req.url, true);
        var query = url_parts.query;
        GLOBAL.token = query.tokenID; //GETTING TOKEN FROM URL
        res.render('index', {message: req.session.messages});
    });

    app.get('/profile', ensureAuthenticated, function (req, res) {
        var query = Appointment.find({});
        console.log('profile for user ' + req.session.user.userID);
        query.where('patientID').equals(parseInt(req.session.user.userID)).exec(function (err, appointments) {
            appointments.sort(utils.compareAppointments);
            var nextAppointments = appointments.filter(utils.removeOldAppointments);
            res.render('profile', {user: req.user, appointments: nextAppointments});
        });
    });

    app.get('/cancelApp', ensureAuthenticated, function (req, res) {
        var url_parts = URL.parse(req.url, true);
        var query = url_parts.query;
        if (query.app != undefined) {
            var i = parseInt(query.app);
            var q = Appointment.find({});
            q.where('patientID').equals(parseInt(req.session.user.userID)).exec(function (err, appointments) {

                appointments.sort(utils.compareAppointments);
                var nextAppointments = appointments.filter(utils.removeOldAppointments);

                Appointment.where().findOneAndRemove({
                    patientID: nextAppointments[i].patientID,
                    doctorID: nextAppointments[i].doctorID,
                    date: nextAppointments[i].date,
                    day: nextAppointments[i].day,
                    realStartTime: nextAppointments[i].realStartTime
                }, function (err) {
                    if (!err) {
                        var Mod = require('./pushHandler') // do not include the dot js
                        Mod.deletePushHandler(nextAppointments[i].pushID);

                        console.log("Removed");
                        q.where('patientID').equals(parseInt(req.session.user.userID)).exec(function (err, appoin) {
                            appoin.sort(utils.compareAppointments);
                            var nextAppointments = appoin.filter(utils.removeOldAppointments);
                            res.render('cancelApp', {user: req.user, appointments: nextAppointments});
                        })
                    } else {
                        console.log("Err in remove");
                        res.render('cancelApp', {user: req.user, appointments: nextAppointments});
                    }
                });
            });
        } else {
            loggedUser = req.user;
            var query = Appointment.find({});
            query.where('patientID').equals(parseInt(req.session.user.userID)).exec(function (err, appointments) {
                appointments.sort(utils.compareAppointments);
                var nextAppointments = appointments.filter(utils.removeOldAppointments);
                res.render('cancelApp', {user: req.user, appointments: nextAppointments});
            });
        }
    });

    app.get('/doctorprofile', ensureAuthenticated, function (req, res) {
        res.render('doctorprofile', {user: req.user, message: ""});
    });

    app.get('/doctorSchedule', ensureAuthenticated, function (req, res) {
        var query = Appointment.find({});
        query.where('doctorID').equals(parseInt(req.session.user.userID)).exec(function (err, appointments) {
            appointments.sort(utils.compareAppointments);
            var nextAppointments = appointments.filter(utils.removeOldAppointments);
            res.render('doctorSchedule', {appointments: nextAppointments});
        });
    });

    app.get('/register', function (req, res) {
        res.render('register', {user: req.user});
    });

    app.get('/editdetails', ensureAuthenticated, function (req, res) {
        res.render('editdetails', {user: req.user, message: ""});
    });

    app.get('/doctoreditdetails', ensureAuthenticated, function (req, res) {
        res.render('doctoreditdetails', {user: req.user, message: ""});
    });

    app.get('/appSummary', ensureAuthenticated, function (req, res) {
        var url_parts = URL.parse(req.url, true);
        var query = url_parts.query;
        res.render('appSummary', {user: req.user, pid: query.pid, pname: query.pname, date: query.date});

    });

    app.post('/appSummary', ensureAuthenticated, function (req, res) {
        var url_parts = URL.parse(req.url, true);
        var query = url_parts.query;
        var q = Appointment.find({});
        q.where('patientID', 'doctorID').equals(parseInt(query.pid), parseInt(req.session.user.userID)).exec(function (err, appointments) {
            appointments.sort(utils.compareAppointments);
            var nextAppointment = appointments.filter(utils.removeOldAppointments);
            nextAppointment = nextAppointment[0];
            var today = new Date();
            if (nextAppointment && ((nextAppointment.date.split('/')[1] - 1) == today.getMonth() &&
                nextAppointment.date.split('/')[0] == today.getDate())) {
                Appointment.update({
                    doctorID: parseInt(req.session.user.userID, 10),
                    patientID: parseInt(query.pid, 10),
                    date: nextAppointment.date,
                    startTime: nextAppointment.startTime
                }, {
                    $set: {
                        "summary": req.body.sum
                    }
                }, function (err) {
                    if (err) {
                        res.render('appSummary');
                    } else {
                        console.log("summary update successful");
                        res.redirect("/doctorprofile");
                    }
                });
            }
        });
    });

    app.get('/searchdoctor', ensureAuthenticated, function (req, res) {
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

    app.post('/searchdoctor', ensureAuthenticated, function (req, res) {
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
                    if (req.body.mfs instanceof Array) {
                        req.body.mfs.forEach(function (mf) {
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
                    if (req.body.langs instanceof Array) {
                        req.body.langs.forEach(function (lang) {
                            langs.push(lang);
                        });
                    } else {
                        langs.push(req.body.langs);
                    }
                    console.log("filtering with " + langs);
                    query.where('Languages').in(langs);
                }

                if (req.body.days) {
                    var days = [];
                    if (req.body.days instanceof Array) {
                        req.body.days.forEach(function (day) {
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
                    if (docs) {
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

    app.post('/doctorprofile', ensureAuthenticated, function (req, res) {
            var query = Appointment.find({});

            if (req.body.pid.length == 29) { // Maccabi
                req.body.pid = req.body.pid.substring(8, 17);
            }
            if (req.body.pid.length == 33) { // Clallit
                req.body.pid = req.body.pid.substring(19, 28);
            }
            if (req.body.pid.length == 38) { // Meaohedet
                req.body.pid = req.body.pid.substring(8, 17);
            }
            if (req.body.pid.length == 21) { // Leomit
                req.body.pid = req.body.pid.substring(3, 12);
            }
            query.where('patientID', 'doctorID').equals(parseInt(req.body.pid), parseInt(req.session.user.userID)).exec(function (err, appointments) {
                if (appointments) {
                    appointments.sort(utils.compareAppointments);
                    var nextAppointment = appointments.filter(utils.removeOldAppointments);
                    nextAppointment = nextAppointment[0];
                    var today = new Date();

                    if (nextAppointment && ((nextAppointment.date.split('/')[1] - 1) == today.getMonth() &&
                        nextAppointment.date.split('/')[0] == today.getDate())) {
                        res.redirect('/appSummary?pid=' + nextAppointment.patientID + "&pname=" + nextAppointment.patientName + "&date=" + nextAppointment.date);


                        //////
                        ////////

                        doctor.findOne({}).where('userID').equals(parseInt(parseInt(nextAppointment.doctorID))).exec(function (err, doctor) {
                            if (!err) {
                                var realminute;
                                if (today.getMinutes() < 10) {
                                    realminute = '0' + today.getMinutes();
                                }
                                else {
                                    realminute = today.getMinutes();
                                }
                                nextAppointment.realStartTime = today.getHours() + ':' + realminute;
                                delayNotification.patientEnter(nextAppointment, doctor.appointmentDuration);
                            }
                        });


                    } else {
                        res.render('doctorprofile', {message: "Patient Dose Not Have Appointments Today"});
                    }
                }
                else {
                    console.log("NoT Found Appointments");
                    res.render('doctorprofile', {message: "Patient Dose Not Have Appointments Today"});
                }
            });
        }
    )
    ;

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

    app.post('/doctoreditdetails', ensureAuthenticated, function (req, res) {
        if (req.body.city != "" && req.body.street != "" && req.body.phone != "" && req.body.minutes != "") {
            doctor.update({userID: parseInt(req.session.user.userID, 10)}, {
                $set: {
                    "ClinicAddress.city": req.body.city,
                    "ClinicAddress.street": req.body.street,
                    "PhoneNumber": req.body.phone,
                    "appointmentDuration": req.body.duration
                }
            }, function (err) {
                if (err) {
                    res.render('doctoreditdetails', {message: "All Fields Must Be Not Empty"});
                } else {
                    console.log("doctor update successful");
                }
            });

            return res.redirect('/doctorprofile');
        } else {
            res.render('doctoreditdetails', {message: "All Fields Must Be Not Empty"});
        }
    });

    app.post('/editdetails', ensureAuthenticated, function (req, res) {
        if (req.body.city != "" && req.body.street != "" && req.body.zipcode != "" && req.body.phone != "" &&
            req.body.email != "" && req.body.minutes != "") {
            patient.update({userID: parseInt(req.session.user.userID, 10)}, {
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
                    res.render('editdetails', {message: "All Fields Must Be Not Empty"});
                } else {
                    console.log("patient update successful");
                }
            });

            return res.redirect('/profile');
        }
        else {
            res.render('editdetails', {message: "All Fields Must Be Not Empty"});
        }
    });

    app.post('/scheduleAppointment', ensureAuthenticated, function (req, res) {
        console.log('inside scheduleAppointment');
        console.log('trying to schedule for user ' + req.body.doctorID);
        doctor.findOne({}).where('userID').equals(parseInt(req.body.doctorID)).exec(function (err, doctor) {
            if (!err) {
                var appointment = new Appointment();
                appointment.patientID = parseInt(req.session.user.userID);
                appointment.patientName = req.session.user.f_name + ' ' + req.session.user.l_name;
                appointment.doctorID = parseInt(req.body.doctorID);
                appointment.doctorName = req.body.doctorName;
                appointment.date = req.body.date;
                appointment.day = req.body.day;
                appointment.startTime = req.body.start;
                appointment.realStartTime = req.body.start;

                appointment.endTime = appointment.startTime;
                var hh = appointment.endTime.toString().split(":")[0];
                var mm = appointment.endTime.toString().split(":")[1];
                var Mod = require('./pushHandler') // do not include the dot js
                appointment.endTime = Mod.calctNotificationSendTime(req.body.date, hh, mm, doctor.appointmentDuration * (-1));
                appointment.endTime = appointment.endTime.toString().split(" ")[4];
                appointment.endTime = appointment.endTime.toString().substr(0, 5);
                appointment.realEndTime = appointment.endTime;
                appointment.delayTime = 0;
                //push send:
                //var msg="you have an appiuntment at "+appointment.date+" "+appointment.startTime+"!";
                patient.findOne({}).where('userID').equals(parseInt(req.session.user.userID)).exec(function (err, pat) {
                    if (!err) {
                        var NotificationCode = Mod.sendPushHandler(appointment.date, appointment.realStartTime, pat.MinutesToBeNotifyBefor, pat.TokenID, false).then(function (notificationCode) {
                            console.log("the NotificationCode is:  " + notificationCode); // <<NotificationCode>> need to be saved in the DB!
                            appointment.pushID = notificationCode;

                            appointment.save(function (err) {
                                console.log('inside save callback');
                                if (err) {
                                    console.log(err);
                                } else {
                                    console.log('Appointment scheduled');
                                    console.log(appointment);
                                    res.send({redirect: '/profile'});
                                }
                            });
                            return notificationCode;
                        });
                    }
                });

                //end
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
                    req.session.user = user;
                    return res.render('doctorprofile', {user: req.user, message: ""});
                } else {
                    if (GLOBAL.token) {
                        patient.update({userID: user.userID}, {
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
                    }
                    req.session.user = user;
                    return res.redirect('/profile');
                }
            });
        })(req, res, next);
    });

    app.get('/appHistory', ensureAuthenticated, function (req, res) {
        res.render("appHistory", {"appointments": {}});
    });

    app.post('/appHistory', ensureAuthenticated, function (req, res) {
        var url_parts = URL.parse(req.url, true);
        var query = url_parts.query;
        var q = Appointment.find({});
        q.where('patientID', 'doctorID').equals(parseInt(req.body.pid), parseInt(req.session.user.userID)).exec(function (err, appointments) {
            var oldAppointment = appointments.filter(utils.getOldAppointments);
            if (oldAppointment.length > 0) {
                res.render("appHistory", {"appointments": oldAppointment});
            } else {
                res.render("appHistory", {"appointments": {}});
            }
        });
    });

    app.get('/logout', function (req, res) {
        req.logout();
        res.redirect('/');
    });

    app.get('/doctorAvaApp', ensureAuthenticated, function (req, res) {
        async.waterfall([
                function (callback) {
                    var url_parts = URL.parse(req.url, true);
                    var query = url_parts.query;
                    doctor.findOne({}).where('userID', parseInt(query.userID)).exec(function (err, doc) {
                        callback(null, doc, parseInt(query.userID));
                    });
                },
                function (doctor, userID, callback) {
                    Appointment.find({}).where('doctorID', userID).exec(function (err, apps) {
                        callback(null, doctor, userID, apps);
                    });
                },
                function (doctor, userID, doctorAppointments, callback) {
                    var availableApps = [];
                    for (var i = 0; i < doctor.WorkDay.length; i++) {
                        console.log('workday ' + i);
                        var startTimeOfWorkDay = new Date();
                        var endTimeOfWorkDay = new Date();
                        var hourStart = parseInt(doctor.WorkDay[i].startTime.split(':')[0]);
                        var mintStart = parseInt(doctor.WorkDay[i].startTime.split(':')[1]);
                        var hourEnd = parseInt(doctor.WorkDay[i].endTime.split(':')[0]);
                        var mintEnd = parseInt(doctor.WorkDay[i].endTime.split(':')[1]);
                        var day;
                        var diff;
                        startTimeOfWorkDay.at({hour: hourStart, minute: mintStart});
                        endTimeOfWorkDay.at({hour: hourEnd, minute: mintEnd});
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
                        if (startTimeOfWorkDay.getDay() <= day) {
                            diff = day - startTimeOfWorkDay.getDay();
                        }
                        else {
                            diff = 7 - (startTimeOfWorkDay.getDay() - day);
                        }
                        startTimeOfWorkDay.addDays(diff);
                        endTimeOfWorkDay.addDays(diff);
                        var hourIsInDoctorAppointments;
                        while (startTimeOfWorkDay.isBefore(endTimeOfWorkDay)) {
                            var date = new Date();
                            var appointmentTime = startTimeOfWorkDay.toTimeString().split(':')[0].toString() + ":" + startTimeOfWorkDay.toTimeString().split(':')[1].toString();
                            var appointmentDate = startTimeOfWorkDay.getDate() + '/' + (startTimeOfWorkDay.getMonth() + 1) + '/' + startTimeOfWorkDay.getFullYear();
                            //console.log('j is ' + appointmentDate + ' ' + appointmentTime);
                            hourIsInDoctorAppointments = false;

                            // check if there is an appointment at hour j exists
                            for (var t = 0; t < doctorAppointments.length; t++) {
                                var diffBetweenAppo = utils.diffInMinutesBetweenTwoHours(doctorAppointments[t].startTime, appointmentTime);
                                //console.log('comparing between ' + doctorAppointments[t].date + ' ' + appointmentDate + ' and between ' + doctorAppointments[t].startTime + ' ' + appointmentTime);
                                if ((doctorAppointments[t].date.split('/')[0] == startTimeOfWorkDay.getDate())
                                    && (doctorAppointments[t].date.split('/')[1] == (startTimeOfWorkDay.getMonth() + 1))
                                    && (doctorAppointments[t].date.split('/')[2] == startTimeOfWorkDay.getFullYear())
                                    && (diffBetweenAppo >= 0 && diffBetweenAppo < doctor.appointmentDuration)) {
                                    // && (doctorAppointments[t].startTime == appointmentTime)) {
                                    hourIsInDoctorAppointments = true;
                                    console.log('found hour as an appointment: ' + appointmentTime);
                                    break;


                                }
                            }
                            if (hourIsInDoctorAppointments == false) {
                                //console.log('going to add an appointment to display');
                                availableApps.push({
                                    date: startTimeOfWorkDay.toString("dd/MM/yyyy"),
                                    day: doctor.WorkDay[i].day,
                                    startTime: startTimeOfWorkDay.toString("HH:mm"),
                                    realStartTime: startTimeOfWorkDay.toString("HH:mm"),
                                    endTime: startTimeOfWorkDay.addMinutes(doctor.appointmentDuration).toString("HH:mm"),
                                    realEndTime: startTimeOfWorkDay.toString("HH:mm"),
                                    dateObj: startTimeOfWorkDay
                                });
                            } else {
                                startTimeOfWorkDay.addMinutes(doctor.appointmentDuration).toString("HH:mm");
                            }
                        }
                    } // workdays FOR loop

                    availableApps.sort(utils.compareAppointments);
                    var nextavailableApps = availableApps.filter(utils.removeOldAppointments);
                    user.findOne({}).where('userID').equals(userID).exec(function (err, user) {
                        callback(null, nextavailableApps, {userVals: user, docVals: doctor});
                    });
                }
            ], function (err, nextavailableApps, doctor) {
                if (!err) {
                    console.log("going to render");
                    nextavailableApps.splice(0, 1);
                    res.render('doctorAvaApp', {doctor: doctor, availableappointments: nextavailableApps});
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

}
;