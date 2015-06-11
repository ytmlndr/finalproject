var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var medicalfieldsSchema = new Schema({
    DoctorsArray: {type: [Number]},
    field: {type: String},
    description: {type: String}
});

module.exports = mongoose.model('MedicalFields', medicalfieldsSchema);