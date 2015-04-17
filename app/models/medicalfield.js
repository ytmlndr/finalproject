/**
 * Created by Michael on 4/8/2015.
 */

var medicalfieldsSchema = new GLOBAL.schema({
    DoctorsArray: { type: [Number]},
    MedicalField: { type: String},
    Description: { type: String}
});

module.exports = mongoose.model('MedicalFields', medicalfieldsSchema );