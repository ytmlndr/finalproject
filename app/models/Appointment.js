var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var appointmentSchema = new Schema({
    patientID: { type: Number, required: true, unique: true },
    doctorID: { type: Number, required: true, unique: true },
    date: {type: String},
    day: {type: String},
    startTime: {type: String},
    endTime: {type: String},
    pushID:{type:String}
});

module.exports = mongoose.model('Appointment', appointmentSchema);