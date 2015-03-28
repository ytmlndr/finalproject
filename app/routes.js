var User = require('./models/user');

module.exports = function(app, passport) {

    app.get('/', function(req, res) {
        if(req.session.messages == null) {
            req.session.messages = '';
        }
        res.render('index', { message: req.session.messages });
    });

    app.get('/profile', ensureAuthenticated, function(req, res) {
        res.render('profile', { user : req.user});
    });

    app.get('/register', function(req, res) {
        res.render('register', {});
    });

    app.post('/register', function(req, res) {
        var user = new User({username: req.body.username, password: req.body.password});
        user.save(function(err) {
            if(err) {
                console.log('error while trying to save new user to db: ' + err);
                req.session.message = 'could not create user';
                return res.redirect('/');
            } else {
                console.log('user ' + user.username + ' saved');
                req.session.message = 'login with new user';
                return res.redirect('/');
            }
        });
    });

    app.post('/login', function(req, res, next) {
        passport.authenticate('local-login', function(err, user, info) {
            if (err) {
                console.log('encountered error');
                return next(err);
            }
            if (!user) {
                console.log('user object is false');
                req.session.messages =  [info.message];
                return res.redirect('/');
            }
            req.logIn(user, function(err) {
                if (err) {
                    console.log('encountered error');
                    return next(err);
                }
                console.log('login successfully');
                return res.redirect('/profile');
            });
        })(req, res, next);
    });

    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

    //app.get('/css/index.css', function(req, res) {
    //    res.sendFile('/css/index.css');
    //});
    //
    //app.get('/css/profile.css', function(req, res) {
    //    res.sendFile('/css/profile.css');
    //});

    function ensureAuthenticated(req, res, next) {
        console.log('ensuring authentication');
        if (req.isAuthenticated()) {
            console.log('user authenticated');
            return next();
        }
        console.log('user is not authenticated');
        res.redirect('/login');
    }
};