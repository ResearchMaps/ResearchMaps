define(['jquery','ajax'],function($,ajax){
	//Implements the forgot password functionality.
	var init = function(){
		$('#forgotPassword').click(function(){
			var username = $('#forgotUsername').val();
			ajax.makeRequest("/forgotPassword","GET",{"username":username},null,function(result){
				if (result) {
					$(".container.login").prepend("<div class='alert alert-success alert-dismissible' role='alert'>Check your email inbox for a password recovery link.</div>");
					console.log("Check email");
                    var options = {};
                    options.backdrop = false;
                    options.show = false;
                    $('#forgot').modal(options);
                    $('#forgot').modal("toggle");
                    $('#forgot').modal("toggle");
                    $('#forgot').data('bs.modal', null);
				}
			});
		})
	};
	return {
		initialize:init
	};
});
