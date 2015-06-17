var mongoose = require('mongoose');
var Appointment = require('./models/Appointment');
var async = require('async');
var date = require('Datejs');
var utils = require('./functionUtils');
var pushHandler = require('./pushHandler');
var patient = require('./models/patient');
var minutesRange = 90;
var minutesDelayToNotify = 10;

module.exports = {

    patientEnterOrExit: function (currentAppointment, doctorAppointmentDuration, isPatientExitAppointment) {
        var diff = utils.diffInMinutesBetweenTwoHours(currentAppointment.realStartTime, currentAppointment.startTime);
        if (diff > Math.min(minutesDelayToNotify, doctorAppointmentDuration)) {
            var db = mongoose.connection;
            async.waterfall(
                function (callback) {
                    callback(null, appointmentsInMinutesRange());
                },
                function (appointments, callback) {
                    appointments.sort(utils.compareAppointments);
                    callback(null, currentAppointment, appointments);
                },
                function (currentAppointment, appointments, callback) {
                    callback(currentAppointment, buildPatientsAndApps(appointments), callback)
                },
                function (currentAppointment, appsAndPatients, callback) {
                    currentAppointment.realStartTime = Date.parseExact(currentAppointment.realStartTime, 'HH:mm');
                    currentAppointment.realEndTime = Date.parseExact(currentAppointment.realEndTime.addMinutes(doctorAppointmentDuration), 'HH:mm');
                    for (var i = 0; i < appsAndPatients.length - 1; i++) {
                        var hour = parseInt(appsAndPatients[i + 1].realStartTime.split(":")[0]);
                        var minutes = parseInt(appsAndPatients[i + 1].realStartTime.split(":")[1]);
                        if (appsAndPatients[i].appointment.realEndTime > appsAndPatients[i + 1].appointment.realStartTime) {
                            appsAndPatients[i + 1].appointment.realStartTime = appsAndPatients[i].appointment.realEndTime;
                            var endDate = pushHandler.calctNotificationSendTime(Date, hour, minutes, doctorAppointmentDuration);
                            appsAndPatients[i + 1].appointment.realEndTime = endDate.getHours() + ':' + endDate.getMinutes();
                            pushHandler.deletePushHandler(appsAndPatients[i + 1].appointment.pushID);
                            pushHandler.sendPushHandler(Date, hour + ':' + minutes, appsAndPatients[i + 1].patient.MinutesToBeNotifyBefor, appsAndPatients[i + 1].patient.TokenID);
                        } else {
                            break;
                        }
                    }
                }
            )
        } else if (isPatientExitAppointment) {
            var appsAndPatients = buildPatientsAndApps(appointmentsInMinutesRange());
            if (currentAppointment.realEndTime != currentAppointment.startTime) {
                for (var i = 0; i < appsAndPatients.length - 1; i++) {
                    //var hour = parseInt(appsAndPatients[i + 1].realStartTime.split(":")[0]);
                    //var minutes = parseInt(appsAndPatients[i + 1].realStartTime.split(":")[1]);
                    if (appsAndPatients[i].appointment.realEndTime > appsAndPatients[i + 1].appointment.realStartTime) {

                    } else {
                        break;
                    }

                }
            }
        }
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

var appointmentsInMinutesRange = function () {
    async.series(
        [function (callback) {
            var appointments = [];
            var currentDate = new Date();
            Appointment.find({}).forEach(function (appointment) {
                var appointmentRealStartTime = Date.parseExact(appointment.realStartTime, 'HH:mm');
                if (currentDate.isBefore(appointmentRealStartTime) && appointmentRealStartTime.isBefore(currentDate.addMinutes(minutesRange))) {
                    appointments.push({appointment: appointment});
                }
            });
            callback(null, appointments);
        }],
        function (err, results) {
            return results;
        });
}
