define(['elixir'],function(elixir){
	elixir.scrollToTheTop = {};
	elixir.scrollToTheTop = (function() {
	    var jQuery = elixir.jQuery;
	    var $ = jQuery;
		var $elixir = jQuery.noConflict();

		function scrollToTheTopFunction() {
			$elixir(window).scroll(function(){
	        if ($elixir(this).scrollTop() > 300) {
	            $elixir('#to_the_top').fadeIn();
	        } else {
	            $elixir('#to_the_top').fadeOut();
	        }
	    });

			$elixir('#to_the_top').click(function(){
		    $elixir("html, body").animate({ scrollTop: 0 }, 400, 'easeOutSine');
		    return false;
	    });
		}
		
		$elixir(document).ready(function() {
			scrollToTheTopFunction();
		});	
	})(elixir.scrollToTheTop);
});


