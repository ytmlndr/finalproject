/**
 * Created by Michael on 5/9/2015.
 */
var AppointmentSchema = new GLOBAL.schema({
    patientID: { type: Number, required: true, unique: true },
    doctorID: { type: Number, required: true, unique: true },
    appointment: {
        date: {type: String},
        day: {type: String},
        startTime: {type: String},
        endTime: {type: String}
    },
    pushID:{type:String}
});

module.exports = mongoose.model('Appointment', AppointmentSchema);