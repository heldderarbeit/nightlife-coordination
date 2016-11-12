'use strict';

var path = process.cwd();
var ClickHandler = require(path + '/app/controllers/clickHandler.server.js');

module.exports = function (app, passport) {

	function isLoggedIn (req, res, next) {
		if (req.isAuthenticated()) {
			return next();
		} else {
			res.send({ error: 'not logged in' });
		}
	}
	
	var clickHandler = new ClickHandler();

	app.route('/')
	    .get(function (req, res) {
            res.render('index.pug', {
                location: req.session.search,
                user: req.user
            });
		});

	app.route('/logout')
		.get(function (req, res) {
			req.logout();
			res.redirect('/');
		});

	app.route('/auth/twitter')
		.get(passport.authenticate('twitter'));

	app.route('/auth/twitter/callback')
		.get(passport.authenticate('twitter', {
			successRedirect: '/',
			failureRedirect: '/auth/twitter'
		}));

	app.route('/api/getBars/:location')
	    .get(clickHandler.getBars);
	    
	app.route('/api/visitBar/:id')
		.post(isLoggedIn, clickHandler.visitBar);
	    
	app.route('/api/leaveBar/:id')
	    .post(isLoggedIn, clickHandler.leaveBar);

};