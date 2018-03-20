define(['jquery','Backbone','expModel','menuView','TableView','SVGview','neurolaxAutocomplete'],function($,Backbone,Model,MenuView,TblView,SVGview,neurolaxAutocomplete){
	var init = function(){
		var ExpColl = Backbone.Collection.extend({
			model:Model,
			findModel : function(id){
				var content = $("#"+id).children("title").text();
				content = content.replace(/\u00a0/g, " ");//replace &nbsp; with regular space
				var split = content.split('->');
				var agent = split[0];
				var target = split[1];
				var getAttributes = function(element){
					element = element.split('\n');
					var attributes = {
						What:element[0]
					};
					if(element[1])
						attributes["Where"] = element[1];
					if(element[2])
						attributes["When"] = element[2];
					return attributes;
				};

				agent = getAttributes(agent);
				target = getAttributes(target);
				var found = $.grep(expList.models,function(element,index){
					var result = true;
					result = result && element.attributes["WhatAgent"] === agent["What"] || '';
					result = result && element.attributes["WhatTarget"] === target["What"];
					result = result && (element.attributes["WhenAgent"] === (agent["When"] || ''));
					result = result && (element.attributes["WhenTarget"] === (target["When"] || ''));
					//console.log(JSON.stringify(element.attributes["TargetWhen"]));
					//console.log(JSON.stringify(target["When"]));
					result = result && (element.attributes["WhereAgent"] === (agent["Where"] || ''));
					result = result && (element.attributes["WhereTarget"] === (target["Where"] || ''));
					return result;
				});

				for(var index = 0; index<found.length;index++)
					found[index] = found[index].attributes;
				return found;
			},
			modifyProperties:function(){
				for(var index = 0;index<this.models.length;index++){
					var expModel = this.models[index].attributes;
					if (!(expModel["SecondAgentManipulation"] == null)) {
						// If experiment has a second agent, it's a double-intervention experiment;
						// don't display the experiment's conclusion.
						expModel["conclusion"] = "";
					}
					else {
						// For all other (single-intervention) experiments,
						// display the experiment's conclusion.
						//expModel["conclusion"] = expModel["ConnectionType"];
						expModel["conclusion"] = expModel["ConnectionType"];
					}
					
					//found[index]["WhatSecondAgent"] = found[index]["SecondAgent"];
					expModel["SecondManipulation"] = expModel["SecondAgentManipulation"];
				}
			}
		});

		var expList = new ExpColl();
		var attrLs = [];
		$('th').each(function(index,value){
			var element = value.innerText;
			element = element.replace(/\s+/g, '');
			if(element === "ID")
				element = "uuid";
			attrLs.push(element);
		});
		
		$('#experiments > table > tbody > tr').each(function(index,row){
			var model = {};
			for (var i = 0; i < row.children.length; i++) {
				if(row.children[i].innerText !== "")
					model[attrLs[i]] = row.children[i].innerText;
			};
			expList.push(new Model(model));
		});
		expList.modifyProperties();
		//View related stuff
		//svg related stuff
		//init
		var svgView = new SVGview({el:"#svg",collection:expList});
        window.expList = expList;

        if (Maps.has(expList) && Maps.has(expList.models)) {
            var col = expList.models;
            for (var i=0; i<col.length; i++){
                if ( Maps.has(col[i].attributes) &&  (!(Maps.has(col[i].attributes.Manipulation))) && (Maps.has(col[i].attributes.Experiment))) {
                    col[i].attributes.Manipulation = col[i].attributes.Experiment;
                }
				// If experiment is in the old representation (no Where's or When's), set array values to empty string
				if ( Maps.has(col[i].attributes) && ((!(Maps.has(col[i].attributes.WhereAgent))) || (!(Maps.has(col[i].attributes.WhenAgent))) || (!(Maps.has(col[i].attributes.WhereTarget))) || (!(Maps.has(col[i].attributes.WhenTarget))))) {
					col[i].attributes.WhereAgent = col[i].attributes.WhereAgent || '';
					col[i].attributes.WhenAgent = col[i].attributes.WhenAgent || '';
					col[i].attributes.WhereTarget = col[i].attributes.WhereTarget || '';
					col[i].attributes.WhenTarget = col[i].attributes.WhenTarget || '';
				}
            }
        }

		

		var FormView = MenuView.getClass(1);
		var formView = new FormView();
		$('#expSidebar').append(formView.render().el);
		$('#_csrf').val($('#csrf').val());
		var p_uuid = location.pathname.split("/")[2];
		$('#addExperiment').attr('action','/paper/' + p_uuid + '/experiment');
		/*$('.edge').click(function(ev){
			if(ev.which == 1)
				svgView.addTable(ev);
			else{
				ev.preventDefault();
				svgView.openDialog(ev);
			}
		});*/

		//Don't submit form by mistake by hitting enter
		$(document).ready(function() {
			$(window).keydown(function(event){
				if(event.keyCode == 13) {
				  event.preventDefault();
				  return false;
				}
			});
		});

		//
		$('.articles').addClass('active');
		
		//hide error on close
		$('.close').click(function(){
			$(this).parent().addClass('hidden');
		});

	};
	return {
		initialize:init
	};
});