define(['elixir'],function(elixir){

	elixir.mobileNavToggle = {};
	elixir.mobileNavToggle = (function() {
	    var jQuery = elixir.jQuery;
	    var $ = jQuery;
		var $elixir = jQuery.noConflict();

		function mobileNavToggleFunction() {
			$elixir('#mobile_navigation_toggle').html('<i class="icon-angle-down"></i>');
			
			$elixir('#mobile_navigation_toggle').click(function(){
				$elixir(this).find('i').toggleClass('icon-angle-up').toggleClass('icon-angle-down');
			});
		}
		
		$elixir(document).ready(function() {
			mobileNavToggleFunction();
		});	
	})(elixir.mobileNavToggle);

});