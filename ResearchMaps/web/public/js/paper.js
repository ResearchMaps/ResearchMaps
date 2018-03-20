define(['jquery','Backbone','dust','autocomplete','ajax','text!../templates/paperAutocomplete.dust'],
function($,Backbone,dust,autocomplete,ajax,autocompleteTmpl){
	//Articles page
	var init = function(){
		$('.articles').addClass('active');
		var displayError = function(errorText){
			//$('#error .errorText').empty();
			$('#error .errorText').append(errorText);
			$('#error').removeClass("hidden");
		};
		$("[data-hide]").click(function(){
			$('.close').parent().addClass('hidden');
		});
		//Search server for existing articles in public and user's account and get back the list
		autocomplete.suggestions(autocompleteTmpl,'article','article','#searchForArticle','/article?term=%QUERY',null,
			function(parsedResponse){
				if(parsedResponse === "No results found"){
					displayError(parsedResponse);
					return [];
				}
				var resultArray = [];
				parsedResponse.forEach(function(element){
					var arr = [];
					var title = element["title"];
					var authors = element["authors"];
					var journal = element["journal"];
					resultArray.push({
						value:title,
						authors:authors,
						journal:journal,
						tokens:arr.push(name)
					});
				});
				return resultArray;
			}
		);
		//Go to the selected paper
		$('#searchForArticle').bind('typeahead:selected', function(obj, datum, name) {
			var title = datum.value;
			var result = $('a.paper').filter(function(index){
				if($(this).text() === title)
					return true;
			})
			window.location.href=result[0].href;
		});
	};

	return {
		initialize:init
	};
})