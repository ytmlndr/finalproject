/**
* Created by Michael on 4/2/2015.
*/

var patientSchema = new GLOBAL.schema({
    userID: { type: String, required: true, unique: true },
    PatientID: { type: String, required: true, unique: true },
    PhoneNumber: { type: String},
    Address: { type: String},
    ZIP:{type:String},
    Email:{type:String},
    MinutesToBeNotifyBefor:{type:String},
    TokenID:{type:String}
});

module.exports = mongoose.model('Patient', patientSchema);
