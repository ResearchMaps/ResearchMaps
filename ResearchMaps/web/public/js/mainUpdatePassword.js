'use strict';

require.config({
	paths:{
		"jquery":'//ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min',
		"ajax":"utils/ajax",
		"bootstrap":"//netdna.bootstrapcdn.com/bootstrap/3.0.2/js/bootstrap.min"
	},
	shim:{
		"bootstrap": {
			deps: ['jquery']
		}
	}
});

require(['jquery','ajax',"bootstrap"],function($,ajax){
	$("[data-hide]").click(function(){
		$(this).parent().addClass('hidden');
	});
	$('#submit').click(function(){
		var newPassword = $('#password').val();
		var confirmPassword = $('#confirmPassword').val();
		if(newPassword !== confirmPassword){
			$('#passwordError').removeClass('hidden');
			return;
		}
		else{
			var uuid= window.location.href.split('/')[4];
			var csrf = $('#_csrf').val();
			ajax.makeRequest('/updatePassword/' + uuid,"PUT",{password:newPassword},csrf,function(result){

			});
		}
	});
});