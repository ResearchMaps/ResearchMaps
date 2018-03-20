define(['jquery','dust','typeahead'],function($,dust){

	var suggestions = function(autocompleteTmpl,templateName,typeaheadName,selector,url,valueKey,filterCallback){
		var compiled = dust.compile(autocompleteTmpl, templateName);
		dust.loadSource(compiled);

		function fakeCompile (dustTemplateName) {
			return {
				render: function(data){
					var html;
					dust.render(dustTemplateName, data, function (err,out) { 
						html = out;
					});
					return html;
				}
			}
		};
		if(valueKey === null)
			valueKey = "value";

		$(selector).typeahead({
			name: typeaheadName,
			minLength:3,
			limit:50,
			template: fakeCompile(templateName).render,
			//template:'<p><strong>{{value}}</strong></p>',
			engine:dust,
			valueKey:valueKey,
			remote:{
				url:url,
				filter:filterCallback
			}
		});
		
		$(selector).parent().css('display','block');
		$('.tt-hint').addClass('form-control');
	};

	return {
		suggestions:suggestions
	};
});