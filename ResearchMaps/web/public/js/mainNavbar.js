'use strict';

require.config({
	
	paths:{
		"jquery":'//ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min',
		"javascript":"/js/javascript",
		"elixir":"/js/elixir",
		"scroll_to_top":"/js/scroll_to_top",
		"icon_checkmark":"/js/icon_checkmark",
		"mobile_toggle_icon_arrow_2":"/js/mobile_toggle_icon_arrow_2",
		"banner1":"/js/banner1",
		"ec_one_bkg1":"/js/ec_one_bkg1",
		"sidebar_hidden":"/js/sidebar_hidden",
		"autocomplete":'/js/autocomplete',
		"ajax":"/js/ajax",
		"dust":'//cdnjs.cloudflare.com/ajax/libs/dustjs-linkedin/1.2.3/dust-full.min',
		"typeahead":'//cdnjs.cloudflare.com/ajax/libs/typeahead.js/0.9.3/typeahead.min',
		"text":'//cdnjs.cloudflare.com/ajax/libs/require-text/2.0.10/text.min',
		"bootstrap":"//netdna.bootstrapcdn.com/bootstrap/3.0.2/js/bootstrap.min"
	},
	shim: {
		"dust": {
			exports: 'dust'
		},
		"typeahead":{
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
		},
		"bootstrap":{
			deps:['jquery']
		}
	}
});

require(["navbar",'jquery'],function(App){
	App.initialize();
});