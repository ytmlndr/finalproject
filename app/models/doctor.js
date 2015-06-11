var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var WorkDaySchema = new Schema
({
    day: {type: String},
    startTime: {type: String},
    endTime: {type: String}
});

var doctorSchema = new Schema
({
    userID: {type: Number, required: true, unique: true},
    PhoneNumber: {type: String},
    ClinicAddress: {
        city: {type: String},
        street: {type: String}
    },
    Languages: {type: [String]},
    MedicalField: {type: [String]},
    WorkDay: {type: [WorkDaySchema]},
    appointmentDuration: {type: Number}
});

module.exports = mongoose.model('doctor', doctorSchema);