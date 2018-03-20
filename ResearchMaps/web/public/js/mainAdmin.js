'use strict';

require.config({
	paths:{
		"jquery":'//ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min',
		"underscore":'//cdnjs.cloudflare.com/ajax/libs/underscore.js/1.5.2/underscore-min',
		"Backbone":'//cdnjs.cloudflare.com/ajax/libs/backbone.js/1.0.0/backbone-min',
		"dust":'//cdnjs.cloudflare.com/ajax/libs/dustjs-linkedin/1.2.3/dust-full.min',
		"text":'//cdnjs.cloudflare.com/ajax/libs/require-text/2.0.10/text.min',
		"typeahead":'//cdnjs.cloudflare.com/ajax/libs/typeahead.js/0.9.3/typeahead.min',
		"autocomplete":'/js/autocomplete',
		"bootstrap":"//netdna.bootstrapcdn.com/bootstrap/3.0.2/js/bootstrap.min",
		"contextMenu":"lib/jQuery-contextMenu-bootstrap-1.5.24/src/jquery.contextMenu",
		"ajax":"/js/ajax",
		"neurolaxAutocomplete":"/js/neurolaxAutocomplete",
	},
	shim: {

		'dust': {
			exports: 'dust'
		},
		'bootstrap': {
			deps: ['jquery']
		},
		"typeahead":{
			deps:['jquery']
		},
		"Backbone":{
			deps:['underscore']
		},
		"contextMenu":{
			deps:['jquery']
		}
	}
});

require(['admin','jquery','bootstrap'],function(App){
	App.initialize();
});