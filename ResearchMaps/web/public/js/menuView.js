define(['jquery','View','dust','neurolaxAutocomplete','text!../templates/addExp.dust','text!../templates/editExperimentModal.dust','text!../templates/addAgent.dust','ajax'],
	function($,View,dust,neurolaxAutocomplete,menuTmpl,editTmpl,addAgentTmpl,ajax){
	dust.loadSource(dust.compile(addAgentTmpl,'addAgent'));
	var init = function(templateType){

		if(templateType == 1){
			return View.subclass("#expSidebar",menuTmpl,"menuTmpl").extend({
				events : {
				"click #addExpSubmit":"submit",
				"click #addAgent":"addAgent",
				"click #removeSecondAgent":"removeSecondAgent",
				"click #addExpClear":"reset",
				"change #empirical":"setEmpirical",
				"change #hypothetical":"setHypothetical"
				},
				addAgent:function(){
					// Check if user has selected a non-intervention for the first (single) agent.
					var isCheckedNIP = document.querySelector('input[value=NIP]').checked;
					var isCheckedNIN = document.querySelector('input[value=NIN]').checked;
					if (isCheckedNIP || isCheckedNIN) {
						alert("You're trying to add a second Agent while specifying a non-intervention" +
						" experiment for the first Agent; ResearchMaps does not support double-intervention experiments" +
						" involving non-interventions of the Agents. If you would like to encode" +
						" a second non-intervention, please enter two separate single-intervention experiments.");
					}
					//Add second Agent
					$('#SecondAgentDiv').removeClass('hide');
					$('.secAgent').removeClass('optional');
                    // Remove non-intervention radio buttons (and their labels) from first agent's
                    // main (non-modal) experiment form.
                    $('input[type=radio][value=NIP]').parent().hide();
                    $('input[type=radio][value=NIN]').parent().hide();
                    // Before adding double-increase and double-decrease radio buttons,
                    // check if there are already extra radio buttons.
                    // This code applies to the main (non-modal) experiment form.
                    if(($('.radio-inline').length <= 3)) {
                        $('.Result').append('<br><label class="radio-inline"><input type="radio" name="Result" value="dIncrease"> &#8593;&#8593;</label>');
                        $('.Result').append('<br><label class="radio-inline"><input type="radio" name="Result" value="dDecrease"> &#8595;&#8595;</label>');
                    }
					// Hide "Add second Agent for double-intervention experiment" button,
					// since we currently support only double-intervention experiments.
					$('#addAgent').hide();
				},
				removeSecondAgent:function(){
					$("#SecondAgentDiv").find("input").val("").attr('checked', false).text("");
					$("#SecondAgentDiv").addClass("hide");
					$('.secAgent').addClass('optional');
					$('#addAgent').show();
					// Hide double-intervention-specific radio buttons
					$('input[type=radio][value=dIncrease]').parent().hide();
					$('input[type=radio][value=dDecrease]').parent().hide();
					// Show non-intervention radio buttons (and their labels) from first agent's
					// main (non-modal) experiment form.
					$('input[type=radio][value=NIP]').parent().show();
					$('input[type=radio][value=NIN]').parent().show();
				},
				reset:function(){
					$("#addExperiment")[0].reset();
                    $(".Result input[checked], #ulManipulations input[checked]").removeAttr("checked");
				},
				setEmpirical:function(){
					document.forms[0].elements["AgentApproach"].removeAttribute("readonly");
					document.forms[0].elements["AgentApproach"].value="";
					document.forms[0].elements["TargetApproach"].removeAttribute("readonly");
					document.forms[0].elements["TargetApproach"].value="";
					$('#addAgent').show();
				},
				setHypothetical:function(){
					document.forms[0].elements["AgentApproach"].value="HYPOTHETICAL";
					document.forms[0].elements["AgentApproach"].setAttribute("readonly", "readonly");
					document.forms[0].elements["TargetApproach"].value="HYPOTHETICAL";
					document.forms[0].elements["TargetApproach"].setAttribute("readonly", "readonly");
					$('#addAgent').hide();
					$("#SecondAgentDiv").find("input").val("").attr('checked', false).text("");
					$("#SecondAgentDiv").addClass("hide");
				},
				render:function(){
					View.subclass().prototype.render.call(this);
					neurolaxAutocomplete.suggest();
					return this;
				},
				submit:function(ev){
					//Check if all input exists
					var flag = true;
					$('.formInput').each(function(){
                        var orig = Maps.sanitizeUserInput($(this).val());
                        $(this).val(orig.trim());
						console.log($(this));
						console.log($(this).val());
						if($(this).val() === "" && $(this).hasClass('tt-hint') === false && $(this).hasClass("optional") === false){
							ev.preventDefault();
							$('#missingValuesError').removeClass('hidden');
							flag=false;
							return false;
						}
						else{
							console.log("Success");
							if( $(this).hasClass('tt-hint') === false)
								$(this).val($(this).val().trim());
						}
					});
					if(flag){
						var count = 0;
						$('input:radio').each(function(){
							if($(this).is(':checked'))
								count+=1;
						});
                        var extra = $("#SecondAgentDiv").hasClass("hide") ? 0 : 1;
						if(count<3+extra){
							console.log(count);
							ev.preventDefault();
							$('#missingValuesError').removeClass('hidden');
						}
					}
					$('.formInput').each(function(){
						if($(this).hasClass('tt-hint') === false){
							var field = $(this).text();
							$(this).text(field.trim());
						}
					});
				}
			});
		}
		else{
			return View.subclass("#editExperiments",editTmpl,"editTmpl").extend({
				events : {
				"click #submitEdit":"submitEdit",
				"click #eAddAgent":"addAgent"
				},
				expID : {
					"AgentWhat":"#eWhatagent",
					"AgentWhere":"#eWhereagent",
					"AgentWhen":"#eWhenagent",
					"AgentApproach":"#eAgentApproach",
					"TargetWhat":"#eWhattarget",
					"TargetWhen":"#eWhentarget",
					"TargetWhere":"#eWheretarget",
					"TargetApproach":"#eTargetApproach",
					"WhatSecondAgent":"#whatesecondAgent",
					"WhereSecondAgent":"#whereesecondAgent",
					"WhenSecondAgent":"#whenesecondAgent",
					"addAgentID":"#eAddAgent",
					"SecondAgentApproach":"#eSecondAgentApproach",
					"SecondManipulation":"eSecondManipulation"
				},
				addAgent:function(){
					$('.eSecondAgent').removeClass('hide');
                    // Remove non-intervention radio buttons (and their labels) from first agent's
                    // modal experiment form.
                    $('input[type=radio][value=NIP]').parent().remove();
                    $('input[type=radio][value=NIN]').parent().remove();
                    // Before adding double-increase and double-decrease radio buttons,
                    // check if there are already extra radio buttons.
                    // This code applies to the modal experiment form
                    // that appears after right-clicking an edge and then
                    // clicking "Edit".
                    if(($('.radio-inline').length <= 8)) {
                        // We need to check <= 8 here (as opposed to 3 in the
                        // above case) because, with the modal up, the main
                        // (non-modal) form already has 3 (or 5) radio buttons,
                        // and the modal adds its 3, for a total of 6 (or 8).
                        $('.Result').append('<br><label class="radio-inline"><input type="radio" name="Result" value="dIncrease"> &#8593;&#8593;</label>');
                        $('.Result').append('<br><label class="radio-inline"><input type="radio" name="Result" value="dDecrease"> &#8595;&#8595;</label>');
                    }
				},
				submitEdit:function(ev){
                    ev.preventDefault();
                    editExperimentModalViewModel.fire(this.model.get("uuid"));
					return;
					var exp = {};
					exp["WhatAgent"] = $(this.expID["AgentWhat"]).val().trim();
					exp["WhereAgent"] = $(this.expID["AgentWhere"]).val().trim();
					exp["WhenAgent"] = $(this.expID["AgentWhen"]).val().trim();
					exp["WhatTarget"] = $(this.expID["TargetWhat"]).val().trim();
					exp["WhereTarget"] = $(this.expID["TargetWhere"]).val().trim();
					exp["WhenTarget"] = $(this.expID["TargetWhen"]).val().trim();
					exp["AgentApproach"] = $(this.expID["AgentApproach"]).val().trim();
					exp["TargetApproach"] = $(this.expID["TargetApproach"]).val().trim();
					exp["WhatSecondAgent"] = $(this.expID["WhatSecondAgent"]).val().trim();
					exp["WhereSecondAgent"] = $(this.expID["WhenSecondAgent"]).val().trim();
					exp["WhenSecondAgent"] = $(this.expID["WhereSecondAgent"]).val().trim();
					exp["SecondAgentApproach"] = $(this.expID["SecondAgentApproach"]).val().trim();
					exp["Manipulation"] = '';
					exp["Result"] = '';
					var getRadioVal = function(key){
						$('#eExperiment').find('input:radio[name=' + key +']').each(
							function(){
								if($(this).is(':checked'))
									exp[key] = $(this).val();
							}
						);
					};
					getRadioVal('Manipulation');
					getRadioVal('Result');
					getRadioVal('eSecondManipulation');
					if(exp["eSecondManipulation"]!=""){
						exp["SecondManipulation"] = exp["eSecondManipulation"];
						delete exp["eSecondManipulation"];
					}
					exp["uuid"] = this.model.get("uuid");
					var paper = {"uuid":window.location.href.split('/')[4]};
					var data = {
						"paper":paper,
						"experiment":exp
					};
					var csrf = $('#csrf').val();
					ajax.makeRequest('/experiment/' + exp["uuid"],'PUT',data,csrf,function(result){
						if(result === "Not Authorized"){
							$('#notAuthorizedError').removeClass('hidden');
							//$('#editExperiments > .modal').modal('hide');
						}
						else
							location.reload(true);
					});
				}
			});
		}
	};

	return {
		getClass:init
	};
});