var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var appointmentSchema = new Schema({
    patientID: {type: Number, required: true},
    patientName: {type: String},
    doctorID: {type: Number, required: true},
    doctorName: {type: String},
    date: {type: String},
    day: {type: String},
    startTime: {type: String},
    realStartTime: {type: String},
    endTime: {type: String},
    realEndTime: {type: String},
    delayTime: {type: Number},
    pushID: {type: String},
    summary: {type: String},
    waitingPatientArray: {type: [Number]}

});

module.exports = mongoose.model('Appointment', appointmentSchema);