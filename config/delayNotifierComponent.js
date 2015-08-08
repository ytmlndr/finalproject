var mongoose = require('mongoose');
var Appointment = require('../app/models/Appointment');
var async = require('async');
var date = require('datejs');
var utils = require('../app/functionsUtils');
var pushHandler = require('../app/pushHandler');
var patient = require('../app/models/patient');
var minutesRange = 90;
var minutesDelayToNotify = 1;

//var NEWAPPOINTMENTNOTIFIER = 1;
//var DELAYNOTIFIER = 2;
//var PREFERNOTIFIER = 3;

module.exports = {

    patientEnter: function (currentAppointment, doctorAppointmentDuration) {
        var diff = utils.diffInMinutesBetweenTwoHours(currentAppointment.realStartTime, currentAppointment.startTime);
        var delayTime = Math.min(minutesDelayToNotify, doctorAppointmentDuration);
        if (diff >= delayTime) {     // patient enter delay OR in time but not origin time
            var db = mongoose.connection;
            async.waterfall(
                [
                    function (callback) {
                        var doctorAppointments = [];
                        var currentDate = new Date();
                        Appointment.find({}).where('doctorID').equals(currentAppointment.doctorID).exec(function (err, appointments) {
                            appointments.forEach(function (appointment) {
                                var appointmentRealStartTime = Date.parseExact(appointment.realStartTime, 'HH:mm');
                                if (currentDate.isBefore(appointmentRealStartTime) && appointmentRealStartTime.isBefore(currentDate.addMinutes(minutesRange))) {
                                    doctorAppointments.push({appointment: appointment});
                                }
                            });
                            callback(null, appointments);
                        });

                        /* var url_parts = URL.parse(req.url, true);
                         var query = url_parts.query;
                         doctor.findOne({}).where('userID', parseInt(query.userID)).exec(function (err, doc) {
                         callback(null, doc, parseInt(query.userID));
                         });*/
                    },
                    /*function (callback) {
                     callback(null, appointmentsInMinutesRange(currentAppointment.doctorID));
                     },*/
                    function (appointments, callback) {
                        appointments.sort(utils.compareAppointments);
                        var nextappo = appointments.filter(utils.removeOldAppointments);
                        callback(null, nextappo);
                    },

                    function (appointments, callback) {
                        var appsAndPatients = [];
                        var currentDate = new Date();
                        var i, j;
                        patient.find({}).exec(function (err, patients) {
                            for (i = 0; i < appointments.length; i++) {
                                for (j = 0; j < patients.length; j++) {
                                    if (appointments[i]._doc.patientID == patients[j]._doc.userID) {
                                        appsAndPatients.push({
                                            appointment: appointments[i],
                                            patient: patients[j]
                                        });
                                        break;
                                    }
                                }
                            }
                            callback(null, appsAndPatients);
                        });

                        /* var url_parts = URL.parse(req.url, true);
                         var query = url_parts.query;
                         doctor.findOne({}).where('userID', parseInt(query.userID)).exec(function (err, doc) {
                         callback(null, doc, parseInt(query.userID));
                         });*/
                    }

                    /* function ( appointments, callback) {

                     var appsAndPatients = [];
                     appointments.forEach(function (appointment) {
                     patient.find({}).where('patientID').equals(appointment.patientID).exec(function (err, patient) {
                     appsAndPatients.push({
                     appointment: appointment,
                     patient: patient
                     })
                     });
                     });
                     callback(null, appsAndPatients);


                     // callback( buildPatientsAndApps(appointments), callback)
                     }*/
                    ,
                    function (appsAndPatients, callback) {
                        //calctNotificationSendTime(i_date, hh, mm, TimeToBeNotifiy)

                        if (diff - currentAppointment.delayTime >= delayTime) {  // patient enter delay

                            var newRealEnd = pushHandler.calctNotificationSendTime(currentAppointment.date, currentAppointment.realEndTime.toString().split(':')[0], currentAppointment.realEndTime.toString().split(':')[1], (-1) * diff);
                            newRealEnd = newRealEnd.toString().substr(16, 5);

                            Appointment.update({
                                patientID: currentAppointment.patientID,
                                doctorID: currentAppointment.doctorID,
                                date: currentAppointment.date,
                                startTime: currentAppointment.startTime
                            }, {
                                $set: {
                                    realEndTime: newRealEnd,
                                    delayTime: currentAppointment.delayTime + delayTime
                                }
                            }, function (err) {
                                if (err) {
                                    console.log("ERROR - current appointment update - ERROR");
                                } else {
                                    console.log("current appointment update :)");
                                }
                            });
                            currentAppointment.realEndTime = newRealEnd;
                            currentAppointment.delayTime = currentAppointment.delayTime + delayTime;
                        }


                        //appsAndPatients.splice(1, appsAndPatients.length);
                        // var currentAppo = {
                        //   appointment: currentAppointment,
                        //   patient: null
                        //};

                        // console.log("\n\n\nBefore:");
                        //console.log(appsAndPatients);
                        // appsAndPatients.splice(0, 1);
                        appsAndPatients[0].appointment = currentAppointment;
                        // console.log("\n\n\nAFTER:");
                        // console.log(appsAndPatients);
                        // appsAndPatients.unshift(currentAppo);

                        for (var i = 0; i < appsAndPatients.length - 1; i++) {
                            var hour = parseInt(appsAndPatients[i + 1].appointment.realStartTime.split(":")[0]);
                            var minutes = parseInt(appsAndPatients[i + 1].appointment.realStartTime.split(":")[1]);

                            if ((utils.diffInMinutesBetweenTwoHours(appsAndPatients[i].appointment.realEndTime, appsAndPatients[i + 1].appointment.realStartTime) ) >= delayTime) {
                                var realSTime = pushHandler.calctNotificationSendTime(appsAndPatients[i + 1].appointment.date, hour, minutes, (-1) * diff);
                                realSTime = realSTime.toString().substr(16, 5); //need to insert all those kind of copied code to func

                                var Ehour = parseInt(appsAndPatients[i + 1].appointment.realEndTime.split(":")[0]);
                                var Eminutes = parseInt(appsAndPatients[i + 1].appointment.realEndTime.split(":")[1]);
                                var realETime = pushHandler.calctNotificationSendTime(appsAndPatients[i + 1].appointment.date, Ehour, Eminutes, (-1) * diff);
                                realETime = realETime.toString().substr(16, 5); // TODO need to insert all those kind of copied code to func

                                Appointment.update({
                                    patientID: appsAndPatients[i + 1].appointment.patientID,
                                    doctorID: appsAndPatients[i + 1].appointment.doctorID,
                                    date: appsAndPatients[i + 1].appointment.date,
                                    startTime: appsAndPatients[i + 1].appointment.startTime
                                }, {
                                    $set: {
                                        realStartTime: realSTime,
                                        realEndTime: realETime,
                                        delayTime: appsAndPatients[i + 1].appointment.delayTime + diff
                                    }
                                }, function (err) {
                                    if (err) {
                                        console.log("ERROR - rest of appointment update - ERROR");
                                    } else {
                                        console.log("rest of  appointment update :)");
                                    }
                                });
                                appsAndPatients[i + 1].appointment.realStartTime = realSTime;
                                appsAndPatients[i + 1].appointment.realEndTime = realETime;

                                pushHandler.deletePushHandler(appsAndPatients[i + 1].appointment.pushID);
                                //delay detact alert (90 minute before)
                                 var msg = "Delay detected!, new Estimated time is:" + realSTime + "!";
                                pushHandler.sendPushHandler(appsAndPatients[i + 1].appointment.date, realSTime, minutesRange, appsAndPatients[i + 1].patient.TokenID, msg);

                                //set new alert
                                 msg = "You have an appiontment at " + appsAndPatients[i + 1].appointment.date + " " + realSTime + "!";      // TO DO - choose better msg :)
                                pushHandler.sendPushHandler(appsAndPatients[i + 1].appointment.date, realSTime, appsAndPatients[i + 1].patient.MinutesToBeNotifyBefor, appsAndPatients[i + 1].patient.TokenID, msg);
                            }
                        }

                    }]
            )
        }
        /*else if (isPatientEnterAppointment) { //patient enter in time
         var appsAndPatients = buildPatientsAndApps(appointmentsInMinutesRange());

         if (diff > Math.min(minutesDelayToNotify, doctorAppointmentDuration)) {   // patient enter in time but not in origin time
         for (var i = 0; i < appsAndPatients.length - 1; i++) {
         //var hour = parseInt(appsAndPatients[i + 1].realStartTime.split(":")[0]);
         //var minutes = parseInt(appsAndPatients[i + 1].realStartTime.split(":")[1]);
         if (appsAndPatients[i].appointment.realEndTime > appsAndPatients[i + 1].appointment.realStartTime) {

         } else {
         break;
         }

         }
         }
         }*/
    }
};

var buildPatientsAndApps = function (appointments) {
    async.series(
        [function (callback) {
            var appsAndPatients = [];
            appointments.forEach(function (appointment) {
                patient.find({}).where('patientID').equals(appointment.patientID).exec(function (err, patient) {
                    appsAndPatients.push({
                        appointment: appointment,
                        patient: patient
                    })
                });
            });
            callback(null, appsAndPatients);
        }],
        function (err, results) {
            return results;
        });
}

var appointmentsInMinutesRange = function (doctorID) {
    async.series(
        [function (callback) {

            var doctorAppointments = [];
            var currentDate = new Date();
            Appointment.find({}).where('doctorID').equals(doctorID).exec(function (err, appointments) {
                appointments.forEach(function (appointment) {
                    var appointmentRealStartTime = Date.parseExact(appointment.realStartTime, 'HH:mm');
                    if (currentDate.isBefore(appointmentRealStartTime) && appointmentRealStartTime.isBefore(currentDate.addMinutes(minutesRange))) {
                        doctorAppointments.push({appointment: appointment});
                    }
                });
                callback(null, doctorAppointments);
            });

            //callback(null, doctorAppointments);
        }],
        function (err, results) {
            return results;
        });
};