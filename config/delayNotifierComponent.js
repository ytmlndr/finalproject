var mongoose = require('mongoose');
var Appointment = require('./models/Appointment');
var async = require('async');
var date = require('Datejs');

var hoursRange = 3;

module.exports = function() {
    var db = mongoose.connection;
    setInterval(function() {
        async.waterfall(
            function(callback){
                var appointments = [];
                var currentDate = new Date();
                Appointment.find({}).forEach(function(appointment) {
                    var appointmentStartTime = Date.parseExact(appointment.startTime, 'HH:mm');
                    if(currentDate.isBefore(appointmentStartTime) && appointmentStartTime.isBefore(currentDate.addHours(hoursRange))) {
                        appointments.push({appointmnet: appointment});
                    }
                });
            })
    },
        1000);
}