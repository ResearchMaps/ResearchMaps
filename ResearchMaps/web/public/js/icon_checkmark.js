define(['elixir'],function(elixir){
	elixir.pageIcon = {};
	elixir.pageIcon = (function() {
	    var jQuery = elixir.jQuery;
	    var $ = jQuery;
		var $elixir = jQuery.noConflict();

		function pageIconFunction() {
			$elixir('#page_icon').html('<i class="icon-check"></i>');
	}
		
		$elixir(document).ready(function() {
			pageIconFunction();
		});	
	})(elixir.pageIcon);
});