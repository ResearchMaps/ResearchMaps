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
		"contextMenu":"/js/jquery.contextMenu",
		"ajax":"/js/ajax",
		"neurolaxAutocomplete":"/js/neurolaxAutocomplete",
		"svgPan":"//talos.github.com/jquery-svgpan/jquery-svgpan.min",
		"javascript":"/js/javascript",
		"elixir":"/js/elixir",
		"scroll_to_top":"/js/scroll_to_top",
		"icon_checkmark":"/js/icon_checkmark",
		"mobile_toggle_icon_arrow_2":"/js/mobile_toggle_icon_arrow_2",
		"banner1":"/js/banner1",
		"ec_one_bkg1":"/js/ec_one_bkg1",
		"sidebar_hidden":"/js/sidebar_hidden",
		"expModel":"/js/expModel",
		"expCollection":"/js/expCollection",
		"menuView":"/js/menuView",
		"TableView":"/js/tableView",
		"View":"/js/View",
		"SVGview":"/js/SVGview"
	},
	shim: {
		"underscore":{
			exports:"_"
		},
		"dust": {
			exports: 'dust'
		},
		"bootstrap": {
			deps: ['jquery']
		},
		"typeahead":{
			deps:['jquery']
		},
		"Backbone":{
			deps:['underscore','jquery'],
			exports: "Backbone"
		},
		"contextMenu":{
			deps:['jquery']
		},
		"svgPan":{
			deps:['jquery']
		},
		"javascript":{
			deps:['jquery']
		},
		"elixir":{
			deps:['jquery']
		},
		"scroll_to_top":{
			deps:['elixir']
		},
		"icon_checkmark":{
			deps:['elixir']
		},
		"mobile_toggle_icon_arrow_2":{
			deps:['elixir']
		},
		"banner1":{
			deps:['elixir']
		},
		"ec_one_bkg1":{
			deps:['elixir']
		},
		"sidebar_hidden":{
			deps:['elixir']
		}
	}
});

require(['addExp','navbar','jquery','bootstrap'],function(App,navbar){
	navbar.initialize();
	App.initialize();
});
