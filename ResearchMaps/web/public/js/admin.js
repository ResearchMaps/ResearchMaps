define(['jquery','ajax'],function($,ajax){
	//Allows admin to approve users to use ResearchMaps
	var init = function(){
		var emailIndex = $('th:contains("Email")')[0].cellIndex;
		$('.approve').click(function(event){
			var tr = $(this).closest('tr')[0];
			var email = $(tr.children[emailIndex]).text();
			var csrf = $('#csrf').val();
			ajax.makeRequest("/user","PATCH",{"email":email},csrf,function(result){
				location.reload(true);
			});
		});
		$('.disapprove').click(function(event){

		});
	};
	return {
		initialize:init
	};
});