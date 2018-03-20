define(['jquery','dust','ajax','autocomplete','text!../templates/neurolaxAutocomplete.dust',
	'text!../templates/experimentsGlobal.dust','text!../templates/mapTarget.dust','text!../templates/relabel.dust'],
	function($,dust,ajax,autocomplete,template,expTemplate,mapTarget,tRelabel){
	//Map page
	var init = function(){
		var relblMap = {};
		$('.map').addClass('active');
		$('#addSubstance').click(function(){
			$('#target').append(mapTarget);
			autocompleteInit('#destinationWhat');
			$('#addSubstance').addClass('hidden');
			$('#removeSecondAgentTarget').removeClass('hidden');
			$('#single-entity-title').addClass('hidden');
			$('#agent-form-title').removeClass('hidden');
		});
		$('#removeSecondAgentTarget').click(function() {
			$('#target').html('');
			$('#addSubstance').removeClass('hidden');
			$('#removeSecondAgentTarget').addClass('hidden');
			$('#single-entity-title').removeClass('hidden');
			$('#agent-form-title').addClass('hidden');
		});
		$("[data-hide]").click(function(){
			$(this).parent().addClass('hidden');
		});
		//AJAX request to get autocomplete suggestions for agent/target
		var autocompleteInit = function(selector){
            //return;
			autocomplete.suggestions(
				template,'neurolaxAutocomplete','neurolaxAutocomplete',
				selector,'/mapAutocomplete?term=%QUERY',null,
				function(parsedResponse){
					var resultArray = [];
					parsedResponse.forEach(function(element){
						var arr = [];
						var name = element["Term"];
						resultArray.push({
							value:name,
							tokens:arr.push(name)
						});
					});
					return resultArray;
				}
			);
		};
		autocompleteInit('#sourceWhat'); 

		// Search again when radio button is changed for
		// Agent only, Target only, or Either.
		$('#agent-target-either input').on('change', function (e) {
			e.preventDefault();
			$('.search').click();
		});

		//Search for graphs in neo4j using paramters from user input
		$('.search').click(function(){

            var numConnections = $('#numConnections').val();

            if (parseInt(numConnections) > 6) {
                var widget = new Maps.Widgets();
                $('#numConnections').parent().append(widget.error("Max Number of Connections is 6"));
                return;
            }

			$('#svg').empty();
			$('.close').parent().addClass('hidden');
			var uri = '/myMap';

			//Add agent data first
			var data = {
				whatSrc:$('#sourceWhat').val(),
				whereSrc:$('#sourceWhere').val(),
				whenSrc:$('#sourceWhen').val()
			};
			//Minimum and maximum scores
			var min = $('#minimum').val();
			var max = $('#maximum').val();

            var userOnly = $(".alignbox").find("input").is(":checked");

            data.userOnly = userOnly;

			//Select search mode based on which radio button is active
			//var mode = $('input[name=search-mode]:checked', '#agent-target-either').val();
			//var mapMode = {
			//	"agentOnly":1,
			//	"targetOnly":2,
			//	"either":3,
			//	"both":4
			//};
			//if(mode in mapMode)
			//	data["mode"] = mapMode[mode];
			
			// Are we in agent-target pair search mode?
			var inAgentTargetPairMode = false;
			if (!($('#target').is(':empty'))){
				inAgentTargetPairMode = true;
			}
			
			// Has the user entered a term in the single entity / Agent search field?
			var hasSingleOrAgentData = false;
			if (inAgentTargetPairMode) {
				if(data.whatSrc.length > 0) {
					hasSingleOrAgentData = true;
				}
			}
			else {
				if(data.whatSrc.length > 0 || data.whereSrc.length > 0 || data.whenSrc.length > 0) {
					hasSingleOrAgentData = true;
				}
			}
			

			// Has the user entered a term in the Target search field?
			var destination = $('#destinationWhat').val();
			var hasTargetData = false;
			if(destination){
				// Get target data from form
				hasTargetData = true;
				data["whatDst"] = destination;
				data["whereDst"] = $('#destinationWhere').val();
				data["whenDst"] = $('#destinationWhen').val();
				//data["mode"] = 4;
			}

			//Ignore Where and When
			data["coalesce"] = $('input[name=coalesce]:checked').val();
			if (data["coalesce"] === "true") {
				data["whereSrc"] = "";
				data["whenSrc"] = "";
				data["whereDst"] = "";
				data["whenDst"] = "";
			}
			
			// Set the query mode based on what the user is querying for.
			if (inAgentTargetPairMode) {
				if (hasSingleOrAgentData && hasTargetData) {
					data["mode"] = 4; // See "both" in mapMode above.
				}
				else {
					// In the agent-target pair form, user left one or both fields blank.
					// Show an error message and return early from this function so query is not performed.
					$('#missingTargetError').removeClass('hidden');
					//$("#missingTargetError").get(0).scrollIntoView();
					$('html, body').animate({
						scrollTop: $("#missingTargetError").offset().top
					}, 250);
					return;
				}
			}
			else {
				if (hasSingleOrAgentData) {
					data["mode"] = 3; // See "either in mapMode above.
					// NOTE: In "single entity" mode, we now remain agnostic as to whether
					// the search term is an Agent or a Target; hence the "either" mode.
				}
			}
			
			if(min)
				data["min"] = min;
			if(max)
				data["max"] = max;

			//Number of edges to traverse
			var numConnections = $('#numConnections').val();
			if(numConnections)
				data["numConnections"] = numConnections;
			//relabel map for relabelling terms in graph 
			data["relabelMap"] = relblMap;
			ajax.makeRequest(uri,"GET",data,null,function(result){
				$('body').css('cursor', 'default');
				if(result === "No match found"){
					$('#noMatchFound').parent().removeClass('hidden');
					//$("#global-map-header-title").get(0).scrollIntoView();
					$('html, body').animate({
						scrollTop: $("#global-map-header-title").offset().top
					}, 250);
					return;
				}
				//var container = document.getElementById('svg');
				//nodes:{color:'#2c3e50',fontColor:'white'}
				//var graph = new vis.Graph(container, {dot:result}, {edges:{length:125}});
				$('#svg').append(result);
				var test1 = document.getElementsByTagName("svg")[0];
				setupHandlers(test1);
				/*var fileref=document.createElement('script');
				fileref.setAttribute("type","text/javascript");
				fileref.setAttribute("src", "/js/SVGPan.js");
				$('#svg svg').append(fileref);*/
				var nodeSet = [];
				$('.node text').each(function(node){
					nodeSet.push({"Name":this.textContent});
				});
				
				var svg = $('#svg').find('svg')[0];
				svg.removeAttribute('viewBox');
					svg.setAttribute("width","100%");
					svg.setAttribute("height",document.getElementById('viewport').getBBox().height);
					var matrix = {
						"a":1,
						"b":0,
						"c":0,
						"d":1,
						"e":0, //Math.abs($('#svg').width()/2 - document.getElementById('viewport').getBBox().width/2),
						"f":document.getElementById('viewport').getBBox().height
					};
					var matrixString = "matrix(" + matrix.a + "," + matrix.b + "," + matrix.c + "," + matrix.d + "," + matrix.e + "," + matrix.f + ")";
					$(svg).find('#viewport')[0].setAttribute('transform',matrixString);

				$('html, body').animate({
					scrollTop: $("#global-map-header-title").offset().top
				}, 250);
				
				var cRelabel = dust.compile(tRelabel,"relabel");
				dust.loadSource(cRelabel);
				dust.render("relabel",{"Names":nodeSet},function(err,html){
					$('#dRelabel #relabelForm').empty();
					$('#dRelabel #relabelForm').append(html);
				});
				//On clicking edge, show table of experiments for selected Agent and Target.
				$('.edge').click(function(event,data){
					var edge = this.childNodes[0].textContent;
					var nodes = edge.split('->');
					var agent = nodes[0],target = nodes[1];
					console.log(agent + " " + target);
					var agentEntities = agent.split('\n');
					var targetEntities = target.split('\n');
					var data = {
						agentWhat:agentEntities[0],
						agentWhere:agentEntities[1],
						agentWhen:agentEntities[2],
						targetWhat:targetEntities[0],
						targetWhere:targetEntities[1],
						targetWhen:targetEntities[2]
					};
					$('html, body').animate({
						scrollTop: $("#experiments").offset().top
					}, 500);
					ajax.makeRequest('/test',"GET",data,null,function(results){
						var compiled = dust.compile(expTemplate,'experiments');
						dust.loadSource(compiled);
						dust.render('experiments',{"results":results},function(err,html){
							$('#experiments').empty();
							$('#experiments').append(html);
							$('.actions').addClass('hide');
							console.log(err);
						});
					})
				});
				//$('svg').svgPan('viewport');
				Maps.Hacks.typesetSuperscripts();
			});
			$('body').css('cursor', 'wait');
		});
		//On clicking relabel, relabel the nodes and redraw the graph.
		$('#relabel').click(function(){
			relblMap = {};
			$('.newName').each(function(){
				var newText = $(this).val();
				var label = $(this).attr('name');
				if(newText !== "")
					relblMap[label] = newText;
			});
			$('.search').click();
			relblMap = {};
		});
	};
	return{
		initialize:init
	};
});