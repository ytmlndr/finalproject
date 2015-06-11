var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var patientSchema = new Schema({
    userID: {type: Number, required: true, unique: true},
    PhoneNumber: {type: String},
    Address: {
        city: {type: String},
        street: {type: String},
        ZIP: {type: Number}
    },
    Email: {type: String},
    MinutesToBeNotifyBefor: {type: Number},
    TokenID: {type: String}
});

module.exports = mongoose.model('patient', patientSchema);
