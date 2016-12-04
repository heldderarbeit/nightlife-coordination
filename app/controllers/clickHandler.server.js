'use strict';

var Bar = require('../models/bars');
var Yelp = require('yelp');
var async = require('async');

function ClickHandler () {
	
    this.getBars = function (req, res) {
		
	req.session.search = req.params.location;
		    
	var yelp = new Yelp({
            consumer_key: process.env.YELP_CONSUMER_KEY,
            consumer_secret: process.env.YELP_CONSUMER_SECRET,
            token: process.env.YELP_TOKEN_KEY,
            token_secret: process.env.YELP_TOKEN_SECRET
        });
            
        yelp.search({ 
            term: 'nightlife', 
            location: req.session.search, 
            limit: 12,
            sort: 2
        })
        .then(function (yelpData) {
            var foundBars = [];
            async.each(yelpData.businesses, function (business, callback) {
                	
                // lean() returns the result as a plain JS object 
                // instead of a full model instance
                Bar.findOne({ 'yelp.id': business.id }).lean().exec(function (err, bar) {
                    if (err) callback('could not search the db');
                		
                    if (bar) {
                	bar['sessionUser'] = { isVisiting: false };
                	if (req.isAuthenticated()) {
			    for (var visitor_id of bar.nightlife.visitor_ids) {
				if (visitor_id === req.user.twitter.id) {
				    bar.sessionUser.isVisiting = true;
			        }								  	  	
			    }
		        }
			foundBars.push(bar);
			callback();
                    } else {
                	var newBar = new Bar();
			newBar.yelp.id = business.id;
			newBar.yelp.name = business.name;
			newBar.yelp.image_url = business.image_url || 'img/buildings/default.png';
			newBar.yelp.rating = business.rating;
			newBar.yelp.review_count = business.review_count;
			newBar.yelp.display_address = business.location.display_address;
							
			newBar.save(function (err) {
			    if (err) callback('could not insert bar in the db');
							    
		                newBar = newBar.toObject();
				newBar['sessionUser'] = { isVisiting: false };
				foundBars.push(newBar);
				callback();
			    });
                        }
                });
	    }, function (err) {
	        if (err) console.error('the async module has encountered a problem:', err);
		res.send(foundBars);
	    });
        })
        .catch(function (err) {
            console.error('could not search yelp:', err);
            res.send(err);
        });
    };

    this.visitBar = function (req, res) {
		
	var id = req.params.id;
		    
	var query = { 'yelp.id': id, 'nightlife.visitor_ids': { $ne: req.user.twitter.id } };
	var update = {
 	    $addToSet: { 'nightlife.visitor_ids': req.user.twitter.id }, 
	    $inc: { 'nightlife.visit_count': 1 }
	};
	    	
	Bar.findOneAndUpdate(query, update, { new: true }, function (err, bar) {
   	    if (bar) {
		res.send(bar.nightlife);
	    } else {
		if (err) console.error(err);
                res.send({ error: 'could not update bar in the db' });
            }
	});
    };
	
    this.leaveBar = function (req, res) {
		
	var id = req.params.id;
		    
	var query = { 'yelp.id': id, 'nightlife.visitor_ids': req.user.twitter.id };
	var update = {
	    $pull: { 'nightlife.visitor_ids': req.user.twitter.id }, 
	    $inc: { 'nightlife.visit_count': -1 }
	};
	    	
	Bar.findOneAndUpdate(query, update, { new: true }, function (err, bar) {
            if (bar) {
                res.send(bar.nightlife);
            } else {
		if (err) console.error(err);
                res.send({ error: 'could not update bar in the db' });
            }
	});
    };
}

module.exports = ClickHandler;
