define(['autocomplete','text!../../templates/neurolaxAutocomplete.dust'],function(autocomplete,autocompleteTmpl){
	return {
		suggest:function(){
			autocomplete.suggestions(autocompleteTmpl,'neurolaxAutocomplete','neurolaxAutocomplete','.autocomplete','/neurolaxAutocomplete?term=%QUERY',null,
				function(parsedResponse){
					var resultArray = [];
					parsedResponse.result.forEach(function(element){
						var arr = [];
						var name = element.name.split('|')[0];
						resultArray.push({
							value:name,
							tokens:arr.push(name)
						});
					});
					return resultArray;
				}
			);
		}
	};
})