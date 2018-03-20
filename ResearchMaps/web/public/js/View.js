define(['jquery','Backbone','dust'],function($,Backbone,dust){
	var subclass = function(rootID,menuTmpl,tmplName){
		var el;
		if(rootID == '' || rootID == null)
			el = null;
		else
			el = $(rootID);
		return Backbone.View.extend({
			el:el,
			template:menuTmpl,
			templateName:tmplName,
			render:function(){
				var Data;
				if(this.model)
					Data = this.model.toJSON();
				else if(this.collection){
					Data = this.collection;
				}
				//console.log("Render : " + this.template);
				dust.loadSource(dust.compile(this.template,this.templateName));
				var _self = this;
				dust.render(this.templateName,Data,function(err,data){
					if(err){
					    console.log(err);
					}
					//document.body.innerHTML = data;
					//_self.$el.html(data);
					_self.setHTML(data);
					//console.log("Data : " + data);
				});
				return this;
			},
			setHTML:function(html){
				this.$el.empty();
				this.$el.append(html);
			}
		});
	};
	return{
		subclass:subclass
	};
});