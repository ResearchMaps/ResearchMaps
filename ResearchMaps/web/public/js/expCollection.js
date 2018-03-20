define(('jquery','Backbone','expModel'),function($,Backbone,Model){
	console.log(Backbone.Collection);
	return Backbone.Collection.extend({
		model:Model
	});
});