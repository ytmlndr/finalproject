/**
 * Created by yotam on 3/22/2015.
 */

var LocalStrategy = require('passport-local').Strategy;
var User          = require('../app/models/user');

module.exports = function(passport) {

    passport.serializeUser(function(user, done) {
        console.log('serializeing user ' + user.id);
        done(null, user.id);
    });

    passport.deserializeUser(function (id, done) {
        User.findById(id, function (err, user) {
            console.log('deserializeing user ' + user.id);
            done(err, user);
        });
    });

    passport.use('local-login', new LocalStrategy({usernameField: 'username', passwordField: 'password'},
        function(username, password, done) {
            if(username.length!=9) return done(null, false, { message: 'length must be 9.'});
            User.findOne({userID : parseInt(username,10)}, function(err, user) {
                if(err) { return done(err); }
                if(!user) { return done(null, false, { message: 'No user found.'}); }
                user.comparePassword(password, function (err, isMatch) {
                    if(err) return done(err);
                    if(isMatch) {
                        return done(null, user);
                    } else {
                        return done(null, false, { message: 'Invalid password' });
                    }
                })
            });
        }));
};
