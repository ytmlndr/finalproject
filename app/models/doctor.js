/**
 * Created by Michael on 4/8/2015.
 */
var doctorSchema = new GLOBAL.schema({
    userID: { type: Number, required: true, unique: true },
    PhoneNumber: { type: String},
    ClinicAddress: {
        city: {type: String},
        street: {type: String}
    },
    Languages:{type:[String]},
    MedicalField:{type:[String]},
    WorkDay:{type:[String]},
    appointmentDuration:{type:Number}
});

module.exports = mongoose.model('Doctor', doctorSchema);