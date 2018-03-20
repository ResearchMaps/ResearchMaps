define(['jquery','dust','neurolaxAutocomplete','ajax',
		'text!../templates/addAgent.dust','text!../templates/showContextFields.dust',
		'text!../templates/experimentModal.dust',
		'text!../templates/editExperimentModal.dust',
		'text!../templates/experiments.dust',
		'contextMenu'],
function($,dust,neurolaxAutocomplete,ajax,addAgent,showContextFields,experimentModal,editExperimentTmpl,expTmpl){
	
	var init = function(){
		$(document).ready(function() {
			$(window).keydown(function(event){
				if(event.keyCode == 13) {
				  event.preventDefault();
				  return false;
				}
			});
		});

		$("#addDesc").click(function(){
			$(".descOptional").removeClass("hide");
		});

		$("[data-hide]").click(function(){
			$(this).parent().addClass('hidden');
		});

		var svg = $('#svg').find('svg')[0];
		if(svg){
			svg.removeAttribute('viewBox');
			svg.setAttribute("width","100%");
			svg.setAttribute("height",document.getElementById('viewport').getBBox().height);
			var matrix = {
				"a":1,
				"b":0,
				"c":0,
				"d":1,
				"e":Math.abs($('#svg').width()/2 - document.getElementById('viewport').getBBox().width/2),
				"f":document.getElementById('viewport').getBBox().height
			};
			var matrixString = "matrix(" + matrix.a + "," + matrix.b + "," + matrix.c + "," + matrix.d + "," + matrix.e + "," + matrix.f + ")";
			$(svg).find('#viewport')[0].setAttribute('transform',matrixString);
		}
		var editAddAgent = addAgent.concat('');//Create a new copy
		$('.paper').addClass('hide');
		var attributes = [];
		$('th').each(function(index,value){
			var element = value.innerText;
			element = element.replace(/\s+/g, '');
			attributes.push(element);
		});
		var models = [];
		$('#experiments > table > tbody > tr').each(function(index,row){
			var model = {};
			for (var i = 0; i < row.children.length; i++) {
				if(row.children[i].innerText !== "")
					model[attributes[i]] = row.children[i].innerText;
			};
			models.push(model);
		});
		$("#clear").click(function(){
			$("#addExperiment")[0].reset();
		});
		$('.articles').addClass('active');
		neurolaxAutocomplete.suggest();
		/*$('#showContextFields').click(function(){
			var text = $('#showContextFields').text();
			if(text === 'Show context fields'){
				$('#contextDiv').append(showContextFields);
				$('#showContextFields').text('Hide context fields');
			}
			else if(text === 'Hide context fields'){
				$('.optional').remove();
				$('#showContextFields').text('Show context fields');
			}
		});*/

		$('#addAgent').click(function(){
			$('.secondAgent').empty();
			var addAgentClone = addAgent.concat('');
			addAgentClone = addAgentClone.replace(new RegExp('Agent','g'),'SecondAgent');
			addAgentClone = addAgentClone.replace(new RegExp('agent','g'),'secondAgent');
			addAgentClone = addAgentClone.replace(new RegExp('Manipulation','g'),'SecondManipulation');
			$('.Result').append('<label class="radio-inline"><input type="radio" name="Result" value="dIncrease"> &#8593;&#8593;</label>');
			$('.Result').append('<label class="radio-inline"><input type="radio" name="Result" value="dDecrease"> &#8595;&#8595;</label>');
			$('.secondAgent').append(addAgentClone);
		});

		var duplicateExp = function(experiment,expID){
			$(expID["AgentWhat"]).val(experiment["AgentWhat"]);
			$(expID["AgentWhere"]).val(experiment["AgentWhere"]);
			$(expID["AgentWhen"]).val(experiment["AgentWhen"]);
			$(expID["AgentApproach"]).val(experiment["AgentApproach"]);
			$(expID["TargetWhat"]).val(experiment["TargetWhat"]);
			$(expID["TargetWhere"]).val(experiment["TargetWhere"]);
			$(expID["TargetWhen"]).val(experiment["TargetWhen"]);
			$(expID["TargetApproach"]).val(experiment["TargetApproach"]);
			var manipulation = $('input:radio[name=Manipulation]');
			manipulation.filter('[value="' + experiment["Manipulation"] + '"]').prop('checked',true);
			var result = $('input:radio[name=Result]');
			result.filter('[value="' + experiment["Result"] + '"]').prop('checked',true);
			console.log(experiment["SecondAgent"]);
			if(experiment["SecondAgent"]){
				$(expID["addAgentID"]).trigger('click');
				$(expID["WhatSecondAgent"]).val(experiment["SecondAgent"]);
				var secManipulation = $('input:radio[name=' + expID["SecondManipulation"] + ']');
				secManipulation.filter('[value="' + experiment["SecondAgentManipulation"] + '"]').prop('checked',true);
				$(expID["SecondAgentApproach"]).val(experiment["SecondAgentApproach"]);
			}
		};

		var deleteExp = function(experimentID){
			var csrf = $('#_csrf').val();
			ajax.makeRequest('/experiment/' + experimentID,'DELETE',{},csrf,function(result){
				if(result === "Not Authorized")
					$('#notAuthorizedError').removeClass('hidden');
				else
					location.reload(true);
			});
		};

		var editExp = function(experiment){
			$('#selectExperiments > .modal').modal('hide');
			var exp = {};
			dust.loadSource(dust.compile(editExperimentTmpl,"editExperiment"));
			dust.render('editExperiment',experiment,function(err,html){
				if(err)
					console.log(err);
				else{
					$('#editExperiments').empty();
					$('#editExperiments').append(html);
					$('#eAddAgent').click(function(){
						$('.eSecondAgent').empty();
						var eAddAgent = editAddAgent.concat('');
						eAddAgent = eAddAgent.replace(new RegExp('Agent','g'),'eSecondAgent');
						eAddAgent = eAddAgent.replace(new RegExp('agent','g'),'esecondAgent');
						eAddAgent = eAddAgent.replace(new RegExp('Manipulation','g'),'eSecondManipulation');
						$('.Result').append('<label class="radio-inline"><input type="radio" name="Result" value="dIncrease"> &#8593;&#8593;</label>');
						$('.Result').append('<label class="radio-inline"><input type="radio" name="Result" value="dDecrease"> &#8595;&#8595;</label>');
						$('.eSecondAgent').append(eAddAgent);
					});

					$('#editExperiments > .modal').modal('show');
					var expID = {
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
					};
					duplicateExp(experiment,expID);
					$('#submitEdit').click(function(){
						var exp = {};
						exp["WhatAgent"] = $(expID["AgentWhat"]).val().trim();
						exp["WhereAgent"] = $(expID["AgentWhere"]).val().trim();
						exp["WhenAgent"] = $(expID["AgentWhen"]).val().trim();
						exp["WhatTarget"] = $(expID["TargetWhat"]).val().trim();
						exp["WhereTarget"] = $(expID["TargetWhere"]).val().trim();
						exp["WhenTarget"] = $(expID["TargetWhen"]).val().trim();
						exp["AgentApproach"] = $(expID["AgentApproach"]).val().trim();
						exp["TargetApproach"] = $(expID["TargetApproach"]).val().trim();
						exp["WhatSecondAgent"] = $(expID["WhatSecondAgent"]).val().trim();
						exp["WhereSecondAgent"] = $(expID["WhenSecondAgent"]).val().trim();
						exp["WhenSecondAgent"] = $(expID["WhereSecondAgent"]).val().trim();
						exp["SecondAgentApproach"] = $(expID["SecondAgentApproach"]).val().trim();
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
						exp["uuid"] = experiment["ID"];
						var paper = {"uuid":window.location.href.split('/')[4]};
						var data = {
							"paper":paper,
							"experiment":exp
						};
						var csrf = $('#_csrf').val();
						ajax.makeRequest('/experiment/' + experiment["ID"],'PUT',data,csrf,function(result){
							if(result === "Not Authorized"){
								$('#notAuthorizedError').removeClass('hidden');
								$('#editExperiments > .modal').modal('hide');
							}
							else
								location.reload(true);
						});
					});
				}
			})
		};

		//Find info clicked edge
		var findModel = function(id){
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

			var found = $.grep(models,function(element,index){
				var result = true;
				result = result && element["AgentWhat"] === agent["What"];
				result = result && element["TargetWhat"] === target["What"];
				result = result && (element["AgentWhen"] === agent["When"]);
				result = result && (element["TargetWhen"] === target["When"]);
				console.log(JSON.stringify(element["TargetWhen"]));
				console.log(JSON.stringify(target["When"]));
				result = result && (element["AgentWhere"] === agent["Where"]);
				result = result && (element["TargetWhere"] === target["Where"]);
				return result;
			});
			return found;
		};
		var modifyProperties = function(found){
			for(var index = 0;index<found.length;index++){
				found[index]["conclusion"] = found[index]["ConnectionType"];
				//found[index]["WhatSecondAgent"] = found[index]["SecondAgent"];
				found[index]["SecondManipulation"] = found[index]["SecondAgentManipulation"];
			}
		};
		$('.edge').click(function(){
			var id = $(this).attr('id');
			var found = findModel(id);
			modifyProperties(found);
			var compiled = dust.compile(expTmpl,"experiments");
			dust.loadSource(compiled);
			dust.render("experiments",{"results":found},function(err,html){
				$('#experimentsDiv').empty();
				$('#experimentsDiv').append(html);
				//Listeners for clicking duplicate/delete/edit in table
				$('.duplicateExp').click(function(e){
					var row =$(this).closest('tr');
					var rowIndex = $($('#experimentsDiv').find('tr')).index(row) - 1;
					var expID = {
						"AgentWhat":"#whatagent",
						"AgentWhere":"#whereagent",
						"AgentWhen":"#whenagent",
						"AgentApproach":"#AgentApproach",
						"TargetWhat":"#whattarget",
						"TargetWhere":"#wheretarget",
						"TargetWhen":"#whentarget",
						"TargetApproach":"#TargetApproach",
						"addAgentID":"#addAgent",
						"WhatSecondAgent":"#whatsecondAgent",
						"SecondAgentApproach":"#SecondAgentApproach",
						"SecondManipulation":"SecondManipulation"
					};
					duplicateExp(found[rowIndex],expID);
				});

				$('.deleteExp').click(function(e){
					var row =$(this).closest('tr');
					var rowIndex = $($('#experimentsDiv').find('tr')).index(row) - 1;
					deleteExp(found[rowIndex]["ID"]);
				});

				$('.editExp').click(function(e){
					var row =$(this).closest('tr');
					var rowIndex = $($('#experimentsDiv').find('tr')).index(row) - 1;
					editExp(found[rowIndex]);
				});
			});
		});
		//Context Menu
		$(function(){

			$.contextMenu({
				selector: '.edge', 
				callback: function(key, options) {
					console.log(state);
					
					var m = "clicked: " + key;
					var id = options.$trigger.attr('id');
					var found = findModel(id);
					modifyProperties(found);
					var compiled = dust.compile(experimentModal,"experimentModal");
					dust.loadSource(compiled);
					dust.render("experimentModal",{"results":found,"button":key},function(err,html){
						$('#selectExperiments').empty();
						$('#selectExperiments').append(html);
						$('#selectExperiments > .modal').modal('show');
						$('#selectExperiments button').click(function(event){

							var action = this.innerText;
							var index = parseInt($('input:radio[name=experiment]:checked').val());
							if(action === "Duplicate"){
								var expID = {
									"AgentWhat":"#whatagent",
									"AgentWhere":"#whereagent",
									"AgentWhen":"#whenagent",
									"AgentApproach":"#AgentApproach",
									"TargetWhat":"#whattarget",
									"TargetWhere":"#wheretarget",
									"TargetWhen":"#whentarget",
									"TargetApproach":"#TargetApproach",
									"addAgentID":"#addAgent",
									"WhatSecondAgent":"#whatsecondAgent",
									"SecondAgentApproach":"#SecondAgentApproach",
									"SecondManipulation":"SecondManipulation"
								};
								duplicateExp(found[index],expID);
								$('#selectExperiments > .modal').modal('hide');
							}
							else if(action === "Delete"){
								deleteExp(found[index]["ID"]);
							}
							else if(action === "Edit"){
								editExp(found[index]);
							}
						});
					});
				},
				items: {
					"Duplicate": {name: "Duplicate", icon: "edit"},
					"Delete": {name: "Delete", icon: "delete"},
					"Edit": {name: "Edit", icon: "edit"}
				}
			});

			$('.context-menu-list').addClass('list-unstyled menu');

		});

		//hide error on close
		$('.close').click(function(){
			$(this).parent().addClass('hidden');
		});

		//Check if all input exists
		$('#submit').click(function(ev){
			var flag = true;
			$('.formInput').each(function(){
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
				if(count<2){
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
			})
		});
	};

	return {
		initialize:init
	};
});