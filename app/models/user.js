var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');
var GENT_SALT = 10;
mongoose.connect(require('../../config/database.js').url);
var db = mongoose.connection;

db.on('error', console.error.bind(console, 'db connection error:'));
db.once('open', function callback() {
    console.log('connected to db');
});

var userSchema = new Schema({
    userID: { type: Number, required: true, unique: true },
    password: { type: String, required: true},
    IsDoctor: { type: Boolean},
    f_name:{type:String},
    l_name:{type:String}
});

userSchema.pre('save', function(next) {
    var user = this;
    console.log('starting hashing process for user ' + user.username);
    if(!user.isModified('password')) {
        console.log('user password is not modified');
        return next();
    }
    bcrypt.genSalt(GENT_SALT, function(err, salt) {
        console.log('generating user salt');
        if(err) {
            console.log('could not generate user salt');
            return next(err);
        }
        var progress = 0;
        bcrypt.hash(user.password, salt, progress, function(err, hash) {
            console.log('generating user hash');
            if(err) {
                console.log('could not create hash ');
                return next(err);
            }
            user.password = hash;
            console.log('hash created for user ' + user.username);
            next();
        });
    });
});

userSchema.methods.comparePassword = function(candidatePassword, cb) {
    console.log('comparing passwords');
    bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
        if(err) {
            console.log('encoutered error');
            return cb(err);
        }
        console.log('passwords match');
        cb(null, isMatch);
    });
};

module.exports = mongoose.model('user', userSchema);