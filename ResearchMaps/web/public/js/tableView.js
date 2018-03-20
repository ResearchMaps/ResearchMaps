define(['jquery','View','menuView','expModel','ajax','text!../templates/experiments.dust','text!../templates/experimentModal.dust'],
	function($,View,menuView,expModel,ajax,tableTmpl,modalTmpl){
    //debugger;
	var init = function(templateType){
        //debugger;
		var TblView;
		if(templateType == 1)
			TblView = View.subclass(null,tableTmpl,"tableTmpl");//check rootID
		else
			TblView = View.subclass("#selectExperiments",modalTmpl,"modalTmpl");
		return TblView.extend({
			events:{
				"click .duplicateExp":"duplicate",
				"click .editExp":"edit",
				"click .deleteExp":"delete"
			},
			getUUID:function(ev){
				var domElement = ev.target;
				return $($($(domElement).parents('tr')[0]).find('.uuid')[0]).text();
			},
			edit:function(ev){
				//get uuid of clicked row
				var uuid = this.getUUID(ev);
				//get model
				var slctdModel = this.getSlctdModel(uuid);
				//render and display MenuView
				var MenuView = menuView.getClass(2);
				var menu = new MenuView({model:new expModel(slctdModel)});
				menu.render();
				$("#editExperiments > .modal").modal('show');
				this.setManipulation(slctdModel["Manipulation"]);
				this.setResult(slctdModel["Result"]);
				this.addSecondAgent(slctdModel,'#eAddAgent','eSecondManipulation');
                Maps.Hacks.setEditExperiment(uuid);
			},
			getSlctdModel:function(uuid){
				for(var index = 0; index < this.collection["results"].length;index++){
					if(this.collection["results"][index].uuid == uuid){
						return this.collection["results"][index];
					}
				}
			},
			setManipulation:function(value){
				var manipulation = $('input:radio[name=Manipulation]');
				manipulation.filter('[value="' + value + '"]').prop('checked',true);
			},
			setResult:function(value){
				var result = $('input:radio[name=Result]');
				result.filter('[value="' + value + '"]').prop('checked',true);
			},
			setScndManipulation:function(value,mnplName){
				var scndManipulation = $('input:radio[name=' + mnplName +']');
				scndManipulation.filter('[value="' + value + '"]').prop('checked',true);
			},
			addSecondAgent:function(model,addAgentSlctr,scndManipulation){
				if(model["WhatSecondAgent"]){
					$(addAgentSlctr).click();
					this.setScndManipulation(model["SecondManipulation"],scndManipulation);
				}
			},
			duplicate:function(ev){
				//get uuid of clicked model
				var uuid = this.getUUID(ev);
				//get model
				var slctdModel = this.getSlctdModel(uuid);
				var csrf = $('#_csrf').val();
				//Fill add experiment sidebar
				var MenuView = menuView.getClass(1);
				var model=new expModel(slctdModel);
				var menu = new MenuView({model:model});

                var hypothetical = slctdModel.AgentApproach=="HYPOTHETICAL" && slctdModel.TargetApproach=="HYPOTHETICAL";

				$('#addAgent').off('click');
				$("#expSidebar").empty();
				$("#expSidebar").append(menu.render().el);
				this.menuView = menu;
				this.setManipulation(slctdModel["Manipulation"]);
				this.setResult(slctdModel["Result"]);
				this.addSecondAgent(slctdModel,'#addAgent','SecondManipulation');
				$('#_csrf').val(csrf);
				var p_uuid = location.pathname.split("/")[2];
				$('#addExperiment').attr('action','/paper/' + p_uuid + '/experiment');
                if (hypothetical) {
                    $("#hypothetical").prop("checked", true);
                    $("#AgentApproach").add("#TargetApproach").attr("readonly", "readonly");
                }
			},
			delete:function(ev){
				//get uuid of clicked model
				var uuid = this.getUUID(ev);
				var csrf = $('#csrf').val();
				ajax.makeRequest('/experiment/' + uuid,'DELETE',{},csrf,function(result){
					if(result === "Not Authorized")
						$('#notAuthorizedError').removeClass('hidden');
					else
						location.reload(true);
				});
			}
		});
	}
	return {getClass:init};
});