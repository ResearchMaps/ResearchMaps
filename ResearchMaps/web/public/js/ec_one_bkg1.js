define(['elixir'],function(elixir){

	elixir.extracontentOneBackgroundImage = {};
	elixir.extracontentOneBackgroundImage = (function() {
	    var jQuery = elixir.jQuery;
	    var $ = jQuery;
		var $elixir = jQuery.noConflict();

		function extracontentOneBackgroundImageFunction() {
			$elixir('#extraContent1').addClass('background1');
		}
		
		$elixir(document).ready(function() {
			extracontentOneBackgroundImageFunction();
		});	
	})(elixir.extracontentOneBackgroundImage);
});