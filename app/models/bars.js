'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Bar = new Schema({
	yelp: {
		id: String,
		image_url: String,
		name: String,
		rating: Number,
		review_count: Number,
		display_address: [String]
	},
   nightlife: {
      visit_count: {type: Number, default: 0},
      visitor_ids: [String]
   }
});

module.exports = mongoose.model('Bar', Bar);