var mongoose = require('mongoose');
var Appointment = require('../app/models/Appointment');
var async = require('async');
var date = require('Datejs');
var utils = require('../app/functionsUtils');
var pushHandler = require('../app/pushHandler');
var patient = require('../app/models/patient');
var minutesRange = 90;
var minutesDelayToNotify = 1;

module.exports = {

    patientEnter: function (currentAppointment, doctorAppointmentDuration) {
        var diff = utils.diffInMinutesBetweenTwoHours(currentAppointment.realStartTime, currentAppointment.startTime);
        var delayTime = Math.min(minutesDelayToNotify, doctorAppointmentDuration);
        if (diff >= delayTime) {     // patient enter delay OR in time but not origin time
            var db = mongoose.connection;
            async.waterfall(
                [function (callback) {
                    callback(null, appointmentsInMinutesRange(currentAppointment.doctorID));
                },
                    function (appointments, callback) {
                        appointments.sort(utils.compareAppointments);
                        callback(null, currentAppointment, appointments);
                    },
                    function (currentAppointment, appointments, callback) {
                        callback(currentAppointment, buildPatientsAndApps(appointments), callback)
                    }],
                function (currentAppointment, appsAndPatients, callback) {
                    if (diff - currentAppointment.delayTime >= delayTime) {  // patient enter delay
                        Appointment.update({
                            patientID: currentAppointment.patientID,
                            doctorID: currentAppointment.doctorID,
                            date: currentAppointment.date,
                            realStartTime: currentAppointment.realStartTime
                        }, {
                            $set: {
                                realStartTime: Date.parseExact(currentAppointment.realStartTime, 'HH:mm'),
                                realEndTime: Date.parseExact(currentAppointment.realEndTime.addMinutes(doctorAppointmentDuration), 'HH:mm'),
                                delayTime: currentAppointment.delayTime + delayTime
                            }
                        });
                    }

                    // currentAppointment.realStartTime = Date.parseExact(currentAppointment.realStartTime, 'HH:mm');
                    //currentAppointment.realEndTime = Date.parseExact(currentAppointment.realEndTime.addMinutes(doctorAppointmentDuration), 'HH:mm');

                    for (var i = 0; i < appsAndPatients.length - 1; i++) {
                        var hour = parseInt(appsAndPatients[i + 1].realStartTime.split(":")[0]);
                        var minutes = parseInt(appsAndPatients[i + 1].realStartTime.split(":")[1]);

                        if ((appsAndPatients[i].appointment.realEndTime - appsAndPatients[i + 1].appointment.realStartTime) >= delayTime) {
                            //appsAndPatients[i + 1].appointment.realStartTime = appsAndPatients[i].appointment.realEndTime;
                            var endDate = pushHandler.calctNotificationSendTime(Date, hour, minutes, doctorAppointmentDuration);
                            //appsAndPatients[i + 1].appointment.realEndTime = endDate.getHours() + ':' + endDate.getMinutes();

                            Appointment.update({
                                patientID: appsAndPatients[i + 1].appointment.patientID,
                                doctorID: appsAndPatients[i + 1].appointment.doctorID,
                                date: appsAndPatients[i + 1].appointment.date,
                                realStartTime: appsAndPatients[i + 1].appointment.realStartTime
                            }, {
                                $set: {
                                    realStartTime: appsAndPatients[i].appointment.realEndTime,
                                    realEndTime: endDate.getHours() + ':' + endDate.getMinutes(),
                                    delayTime: appsAndPatients[i + 1].appointment.delayTime + delayTime
                                }
                            });

                            pushHandler.deletePushHandler(appsAndPatients[i + 1].appointment.pushID);
                            pushHandler.sendPushHandler(Date, hour + ':' + minutes, appsAndPatients[i + 1].patient.MinutesToBeNotifyBefor, appsAndPatients[i + 1].patient.TokenID);
                        }
                    }

                }
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





