define(['elixir'],function(elixir){

	elixir.titleBackgroundImage = {};
	elixir.titleBackgroundImage = (function() {
	    var jQuery = elixir.jQuery;
	    var $ = jQuery;
		var $elixir = jQuery.noConflict();

		function titleBackgroundImageFunction() {
			$elixir('#banner').addClass('background1');
		}
		
		$elixir(document).ready(function() {
			titleBackgroundImageFunction();
		});	
	})(elixir.titleBackgroundImage);
});