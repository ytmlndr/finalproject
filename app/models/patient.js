/**
* Created by Michael on 4/2/2015.
*/

var patientSchema = new GLOBAL.schema({
    userID: { type: Number, required: true, unique: true },
    PhoneNumber: { type: String},
    Address:{
        city:{ type: String},
        street:{ type: String},
        ZIP:{type:Number}
    },
    Email:{type:String},
    MinutesToBeNotifyBefor:{type:Number},
    TokenID:{type:String}
});

module.exports = mongoose.model('Patient', patientSchema);
