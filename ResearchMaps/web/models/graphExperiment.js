/**
 * Provides a class to manipulate experiments(add/remove/modify/retrieve).
 * @module graphExperiment
 */

var DB = require('./DBobject.js')
, graphDB = DB.graphDB
, async = require('async')
, types = require('./Types.json')
, graph = require('./graph.js')
, uuid = require('node-uuid');

/**
* A class to add/remove/edit/get experiments.
* @class Experiment
* @constructor
*/
function Experiment(){};


var isAuthorized = function(username,uuid,callBack, checkForPublicString){
	
	var checkForPubString = checkForPublicString || false;
	
	var query = 
	[
		"MATCH (u:User)-[r*1..2]->(n)",
		"where u.username = {username} and n.uuid = {uuid}",
		"return u,n"
	].join("\n");
	var params = {
		uuid:uuid,
		username:username
	};
	graphDB.instance.query(query,params,function(err,results){
		console.log(err);
		if(results.length === 0 && (!checkForPubString || (checkForPubString && username != "public")))
			callBack("Not Authorized",null);
		else
			callBack(err,results);
	});
};
/**
 * Edit an experiment.
 *
 * @method createNode
 * @async
 * @param {String} uuid Experiment UUID.
 * @param {String} username User who is editing the experiment.
 * @param {Object} paper attributes of the paper that the experiment belongs to.
 * @param {Object} experiment the new expeirment object.
 * @param {Object} agent Specifies the agent(What/Where/When)
 * @param {Object} target Specifies the target(What/Where/When)
 * @param {Function} controllerCallback calling function's callback to be executed once the experiemnt has been modified or error is encountered.
 * @return None
 */

Experiment.prototype.editExperiment = function(uuid,username,paper,experiment,agent,target,controllerCallback){
	var _self = this;

	async.waterfall([
		function(callback){
			console.log("Deleting old experiment");
			_self.deleteExperiment(username,uuid,callback);
		},
		function(results,callback){
			console.log("Adding new experiment");
			delete experiment["uuid"];
			_self.addExperiment(username,paper,experiment,agent,target,callback);
		}
	],
	function(err,results){
		controllerCallback(err,results);
	});

}

/**
 * Create a new node of given type and data.
 *
 * @method createNode
 * @async
 * @param {String} username user who's trying to delete the experiment.
 * @param {String} uuid experiment's UUID.
 * @param {Function} controllerCallback calling function's callback to be executed once the experiment is deleted or error is encountered.
 * @return None
 */

Experiment.prototype.deleteExperiment = function(username,uuid,controllerCallback){
	async.waterfall([
			function(callback){
				isAuthorized(username,uuid,callback, true);
			},
			function(res,callback){
				var query = [
					"Match (n:Experiment)-[:agent]-(:NeurolaxTerm)-[r]->(:NeurolaxTerm)<-[:target]-(n:Experiment)",
					"Where n.uuid={uuid}",
					"Return n,r"
				].join("\n");

				graphDB.instance.query(query,{uuid:uuid},function(err,results){
					
					callback(err,results);
				})
			},
			function(results,callback){
				//Change score
				var exp = results[0]["n"]["_data"]["data"];
				var score = JSON.parse(results[0]["r"]["_data"]["data"]["score"] || "null");
				var conclusion = exp.conclusion;
				var manipulation;
				var isHypothetical = exp.AgentApproach == "HYPOTHETICAL" && exp.TargetApproach == "HYPOTHETICAL" ? true : false;

				if(exp.WhatSecondAgent)
					manipulation = "Mediation";
				else if(exp.Manipulation === "NIP" || exp.Manipulation === "NIN")
					manipulation = "Non-Intervention";
				else
					manipulation = exp.Manipulation;
				var setScoreString = '';
				if(conclusion === "No conclusion" || score == null) {
					setScoreString = '';
				}
				else{
					setScoreString = "Set r.score={score}";
					score[conclusion][manipulation].n-=1;
					score[conclusion][manipulation].score-=0.125 * Math.pow(0.5,score[conclusion][manipulation].n);
					if (isHypothetical) {
						var hypScore = JSON.parse(results[0]["r"]["_data"]["data"]["hypScore"]);
						hypScore[conclusion][manipulation].n-=1;
						hypScore[conclusion][manipulation].score-=0.125 * Math.pow(0.5,hypScore[conclusion][manipulation].n);
						setScoreString = "Set r.score={score}, r.hypScore={hypScore}";
					}
				}
				var query = [
					"Match (p:Paper)-[r1:consistsOf]-(n:Experiment)-[r2:agent]-(:NeurolaxTerm)-[r]->(:NeurolaxTerm)<-[r3:target]-(n:Experiment)",
					"Where n.uuid={uuid}",
					setScoreString,
					"Delete r1,r2,r3,n"
				].join("\n");
				
				if (isHypothetical) {
					var params = {
						uuid:uuid,
						score:JSON.stringify(score),
						hypScore:JSON.stringify(hypScore)
					};
				}
				else {
					var params = {
						uuid:uuid,
						score:JSON.stringify(score)
					};
				}
				console.log(query);
				console.log(JSON.stringify(params));
				
				graphDB.instance.query(query,params,function(err,results){
					
					callback(err,results);
				});
			}
		],
		function(err,results){
			if(err)
				console.log(err);
			
			controllerCallback(err,results);
	});
};

/**
 * Finds all experiments given an agent and a target.
 *
 * @method getExperiments
 * @async
 * @param {Object} agent Specifies the agent(What/Where/When)
 * @param {Object} target Specifies the target(What/Where/When)
 * @param {Function} controllerCallback calling function's callback to be executed once the experiments are found or error is encountered.
 * @return None
 */

Experiment.prototype.getExperiments = function(agent,target,controllerCallback){
	console.log(JSON.stringify(agent));
	console.log(JSON.stringify(target));
	var query = "match (p:Paper)-[:consistsOf]-(a:Experiment)-[:agent]-(m:NeurolaxTerm)-[r]->(n:NeurolaxTerm)<-[:target]-(a:Experiment)";
	var params = {
		srcWhat:agent.What,
		dstWhat:target.What
	};
	var srcString = "where m.What = {srcWhat}";
	var dstString = " AND n.What = {dstWhat}"
	if(agent.When && agent.When !== ""){
		srcString+=" AND m.When={srcWhen}";
		params["srcWhen"] = agent["When"];
	}
	if(agent.Where && agent.Where!== ""){
		srcString+=" AND m.Where={srcWhere}";
		params["srcWhere"] = agent["Where"];
	}
	if(target.When && target.When!== ""){
		dstString+=" AND n.When={dstWhen}";
		params["dstWhen"] = target["When"];
	}
	if(target.Where && target.Where !== ""){
		dstString+=" AND n.Where={dstWhere}";
		params["dstWhere"] = target["Where"];
	}
	query = [
		query,
		srcString,
		dstString,
		"Return p,a,m,n, r;"
	].join("\n");
	console.log(query);
	console.log(JSON.stringify(params));
	graphDB.instance.query(query,params,function(err,results){
		if(err)
			controllerCallback(err,null);
		else{
			var addObject = function(experiment,object){
				for(key in object)
					experiment[key] = object[key];
			};
			var experiments=[];
			results.forEach(function(row){
				var paper = row["p"]["_data"]["data"];
				var experiment = row["a"]["_data"]["data"];
				var agent = row["m"]["_data"]["data"];
				var rel = row["r"]["_data"]["data"];
				agent = {
					"WhatAgent":agent["What"],
					"WhereAgent":agent["Where"],
					"WhenAgent":agent["When"]
				};
				var target = row["n"]["_data"]["data"];
				target = {
					"WhatTarget":target["What"],
					"WhereTarget":target["Where"],
					"WhenTarget":target["When"]
				};
				addObject(experiment,paper);
				addObject(experiment,agent);
				addObject(experiment,target);
				addObject(experiment,rel);
				experiments.push(experiment);
			});
			// For all double-intervention experiments, set the conclusion to a blank string.
			for(var experimentIdx = 0; experimentIdx < experiments.length; experimentIdx++) {
				if("WhatSecondAgent" in experiments[experimentIdx]) {
					experiments[experimentIdx]["conclusion"] = " ";
				}
			}
			controllerCallback(err,experiments);
		}
	});
}

/**
 * Finds all the experiments associated to the requested paper and makes the graph.
 *
 * @method graph
 * @async
 * @param {String} username User who requests the page.
 * @param {String} uuid uuid of the paper requested.
 * @param {Function} controllerCallback calling function's callback to be executed once the paper and it's experiments are found or error is encountered.
 * @return None
 */

Experiment.prototype.graph = function(username,uuid,controllerCallback){
	var start = new Date();
	//console.log(request.query.uuid);

	var params = {
		uuid:uuid
	};
	console.log(uuid);
	console.log(uuid.length);
	async.waterfall([
		function(callback){
			var query=[
				"Match (u:User)-[:adds]->(p:Paper)",
				"where (u.username={username} OR u.username='public') AND p.uuid={uuid}",
				"Return u,p"
			].join("\n");
			params["username"] = username;
			console.log(query);
			console.log(JSON.stringify(params));
			graphDB.instance.query(query,params,function(err,res){
				if(res.length === 0)
					callback("Not authorized",null);
				else
					callback(err,res);
			});
		},
		function(paper,callback){
			console.log(JSON.stringify(paper[0]["p"]["_data"]["data"]));
			if(paper.length === 0){
				controllerCallback("No paper found");
				return;
			}
			var query = [
				"match (p:Paper)-[:consistsOf]-(a:Experiment)-[:agent]-(m:NeurolaxTerm)-[r]->(n:NeurolaxTerm)<-[:target]-(a:Experiment)",
				"where p.uuid={uuid}",
				"return m,n,r,a,p;"
			].join("\n");
			console.log(query);

			graphDB.instance.query(query,params,function(err,results){
				console.log(err);
				//response.json(results);
				if(err){
					controllerCallback(err);
					return;
				}
				var experiments = [];
				console.log(JSON.stringify(results));
				if(results.length > 0){
					results.forEach(function(element){
						var experiment = element["a"]["_data"]["data"];
						experiment["WhatAgent"] = element["m"]["_data"]["data"]["What"];
						experiment["WhenAgent"] = element["m"]["_data"]["data"]["When"];
						experiment["WhereAgent"] = element["m"]["_data"]["data"]["Where"];
						experiment["WhatTarget"] = element["n"]["_data"]["data"]["What"];
						experiment["WhenTarget"] = element["n"]["_data"]["data"]["When"];
						experiment["WhereTarget"] = element["n"]["_data"]["data"]["Where"];
						experiments.push(experiment);
					});
					var end = new Date();
					var timeDiff =  end - start;
					console.log("Query execution time is " + timeDiff);
					graph.create(results,function(err,results){
						controllerCallback(err,results,experiments,paper[0]["p"]["_data"]["data"]);
					});
				}
				else{
					console.log("Paper with 0 experiments " + JSON.stringify(paper[0]["p"]["_data"]["data"]));
					controllerCallback(err,null,null,paper[0]["p"]["_data"]["data"]);
				}
			});
		}],function(err,results){
			controllerCallback(err,null);
		});
};

/**
 * Add a new experiment if the user is authhorized.
 *
 * @method addExperiment
 * @async
 * @param {String} username User entering the experiment.
 * @param {Object} paper the paper that the experiment will be added to.
 * @param {Object} experiment the experiment to be added.
 * @param {Object} agent the agent object for the experiment(What/Where/When).
 * @param {Object} target the target object for the experiment(What/Where/When).
 * @param {Function} controllerCallback calling function's callback to be executed once the experiment is added or error is encountered.
 * @return None
 */

Experiment.prototype.addExperiment = function(username,paper,experiment,agent,target,controllerCallback){
	console.log(agent);
	console.log(target);
	console.log(experiment);
	async.waterfall([
		function(callback){
			isAuthorized(username,paper["uuid"],callback, true);
		},
		function(res,outerCallback){
			var manipulation = {
				"Negative":-1,
				"NIN":-1,
				"NIP":1,
				"Positive":1
			};

			var result = {
				"Decrease":-1,
				"No Change":0,
				"Increase":1
			};
			var conclusion;

			if(experiment.WhatSecondAgent){
				//if(experiment.SecondManipulation==="Negative" && experiment.Result === "No Change")
				//	conclusion = "Excitatory";
				//else
				//	conclusion = "No conclusion";
				//console.log(conclusion);
				conclusion = "Excitatory";
			}
			else{
				var product = manipulation[experiment.Manipulation] * result[experiment.Result];

				switch(product){
					case 1:
						conclusion = "Excitatory";
						break;
					case -1:
						conclusion = "Inhibitory";
						break;
					case 0:
						conclusion = "No Relation";
				}
			}
			experiment.uuid = uuid.v4();
			var query;
			query = [
					"Match (paper:" + types.node.PAPER + ")",
					"Where paper.uuid={uuid}",												//Find paper
					"Merge (agent:" + types.node.TERM + "{What:{agent}.What" +
					",When:{agent}.When" +
					",Where:{agent}.Where" +
					"})",																	//create agent if not exists
					"Merge (target:" + types.node.TERM + "{What:{target}.What" +
					",When:{target}.When" +
					",Where:{target}.Where" +
					"})",																	//create target if not exists
					"Create (experiment:" + types.node.EXPERIMENT + "{experiment})",			//create experiment
					"Create unique (agent)-[rel:" + types.rel.GIVES + "]->(target)",			//create relationship : agent and target (if one doesn't exist already)
					"Create (experiment)-[:" + types.rel.AGENT + "]->(agent)",				//create relationship : experiment and agent
					"Create (experiment)-[:" + types.rel.TARGET + "]->(target)",			//create relationship : experiment and target
					"Create (paper)-[:" + types.rel.CONSISTSOF + "]->(experiment)",			//create relationship : paper and experiment
					"Return id(agent) as agentID ,id(target) as targetID,id(rel) as relID,rel.score as score,rel.hypScore as hypScore"
				].join("\n");
			var params = {
				uuid:paper.uuid,
				agent:agent,
				target:target,
				experiment:experiment
			};
			params["experiment"]["conclusion"] = conclusion;
			console.log(JSON.stringify(params));
			async.waterfall([
				function(callback){
					graphDB.instance.query(query,params,function(err,results){
						console.log("Err is " + err);
						callback(err,results);
					});
				},
				function(results,callback){
					console.log(conclusion);
					if(conclusion === "No conclusion"){
						callback(null,results);
						return;
					}
					console.log(JSON.stringify(results));
					var agentID = results[0].agentID;
					var targetID = results[0].targetID;
					var relID = results[0].relID;
					var score = results[0].score;
					var hypScore = results[0].hypScore;
					
					var isHypothetical = false;
					if (experiment.AgentApproach == "HYPOTHETICAL" && experiment.TargetApproach == "HYPOTHETICAL") {
						isHypothetical = true;
					}

					var experimentType;
					if(experiment.WhatSecondAgent)
						experimentType = "Mediation";
					else if(experiment.Manipulation === "NIN" || experiment.Manipulation === "NIP")
						experimentType = "Non-Intervention";
					else
						experimentType = experiment.Manipulation;
					if(score === null){
						var rel = {};
						rel["Excitatory"] = {
							"Positive":{n:0,score:0},
							"Negative":{n:0,score:0},
							"Non-Intervention":{n:0,score:0},
							"Mediation":{n:0,score:0}
						};

						rel["Inhibitory"] = {
							"Positive":{n:0,score:0},
							"Negative":{n:0,score:0},
							"Non-Intervention":{n:0,score:0},
							"Mediation":{n:0,score:0}
						};

						rel["No Relation"] = {
							"Positive":{n:0,score:0},
							"Negative":{n:0,score:0},
							"Non-Intervention":{n:0,score:0},
							"Mediation":{n:0,score:0}
						}; 

						rel[conclusion][experimentType].n = 1;
						rel[conclusion][experimentType].score = 0.125;

						var hypRel = {};
						if (isHypothetical) {
							hypRel["Excitatory"] = {
								"Positive": {n: 0, score: 0},
								"Negative": {n: 0, score: 0},
								"Non-Intervention": {n: 0, score: 0},
								"Mediation": {n: 0, score: 0}
							};
							hypRel["Inhibitory"] = {
								"Positive": {n: 0, score: 0},
								"Negative": {n: 0, score: 0},
								"Non-Intervention": {n: 0, score: 0},
								"Mediation": {n: 0, score: 0}
							};
							hypRel["No Relation"] = {
								"Positive": {n: 0, score: 0},
								"Negative": {n: 0, score: 0},
								"Non-Intervention": {n: 0, score: 0},
								"Mediation": {n: 0, score: 0}
							};
							hypRel[conclusion][experimentType].n = 1;
							hypRel[conclusion][experimentType].score = 0.125;
						}
						
						if (isHypothetical) {
							query = [
								"Start agent = node({agentID}),target=node({targetID})",
								"Match (agent:NeurolaxTerm)-[rel:gives]->(target:NeurolaxTerm)",
								"Set rel.score={rel}, rel.hypScore={hypRel}",
								"Return rel.score"
							].join("\n");
							params = {
								agentID:agentID,
								targetID:targetID,
								rel:JSON.stringify(rel),
								hypRel:JSON.stringify(hypRel),
								conclusion:conclusion
							};
						}
						else {
							query = [
								"Start agent = node({agentID}),target=node({targetID})",
								"Match (agent:NeurolaxTerm)-[rel:gives]->(target:NeurolaxTerm)",
								"Set rel.score={rel}",
								"Return rel.score"
							].join("\n");
							params = {
								agentID:agentID,
								targetID:targetID,
								rel:JSON.stringify(rel),
								hypRel:JSON.stringify(hypRel),
								conclusion:conclusion
							};
						}
						graphDB.instance.query(query,params,function(err,results){
							callback(err,results);
						});
					}
					else{
						score = JSON.parse(score);
						score[conclusion][experimentType].score+=0.125*Math.pow(0.5,score[conclusion][experimentType].n);
						score[conclusion][experimentType].n+=1;
						score = JSON.stringify(score);
						var hypRel = {};
						if (isHypothetical) {
							if (hypScore === null) {
								hypRel["Excitatory"] = {
									"Positive": {n: 0, score: 0},
									"Negative": {n: 0, score: 0},
									"Non-Intervention": {n: 0, score: 0},
									"Mediation": {n: 0, score: 0}
								};
								hypRel["Inhibitory"] = {
									"Positive": {n: 0, score: 0},
									"Negative": {n: 0, score: 0},
									"Non-Intervention": {n: 0, score: 0},
									"Mediation": {n: 0, score: 0}
								};
								hypRel["No Relation"] = {
									"Positive": {n: 0, score: 0},
									"Negative": {n: 0, score: 0},
									"Non-Intervention": {n: 0, score: 0},
									"Mediation": {n: 0, score: 0}
								};
								hypRel[conclusion][experimentType].n = 1;
								hypRel[conclusion][experimentType].score = 0.125;
								hypScore = JSON.stringify(hypRel);
							}
							else {
								hypScore = JSON.parse(hypScore);
								hypScore[conclusion][experimentType].score+=0.125*Math.pow(0.5,hypScore[conclusion][experimentType].n);
								hypScore[conclusion][experimentType].n+=1;
								hypScore = JSON.stringify(hypScore);
							}
						}
						if (isHypothetical) {
							query = [
								"Start rel=rel({relID})",
								"Set rel.score={score}, rel.hypScore={hypScore}"
							].join("\n");
							params = {
								relID: relID,
								score: score,
								hypScore: hypScore
							};
						}
						else {
							query = [
								"Start rel=rel({relID})",
								"Set rel.score={score}"
							].join("\n");
							params = {
								relID: relID,
								score: score
							};
						}
						graphDB.instance.query(query,params,function(err,results){
							callback(err,results);
						});
					}

				}
			],function(err,results){
				outerCallback(err,results);
			});
		}],
		function(err,results){
			controllerCallback(err,results);
		}
	);

};

/**
 * Highlight an experiment in a map.
 *
 * @method createNode
 * @async
 * @param {String} username User who is editing the experiment.
 * @param {String} uuid Experiment UUID.
 * @param {Function} controllerCallback calling function's callback to be executed once the experiment has been modified or error is encountered.
 * @return None
 */
Experiment.prototype.highlightExperiment = function(username,uuid,controllerCallback){
	var _self = this;

	async.waterfall([
			function(callback){
				isAuthorized(username,uuid,callback,true);
			},
			function(res,callback){
				var query = [
							"MATCH (n:Experiment)",
							"WHERE n.uuid={uuid}",
							"RETURN n.isHighlighted"
						].join("\n");
				graphDB.instance.query(query,{uuid:uuid},function(err,results){
					callback(err,results);
				})
			},
			function(res,callback) {
				var isHighlighted = res[0]["n.isHighlighted"];
				var query = [];
				if (isHighlighted) {
					query = [
						"MATCH (n:Experiment)",
						"WHERE n.uuid={uuid}",
						"SET n.isHighlighted=false"
					].join("\n");
				}
				else {
					query = [
						"MATCH (n:Experiment)",
						"WHERE n.uuid={uuid}",
						"SET n.isHighlighted=true"
					].join("\n");
				}
				graphDB.instance.query(query,{uuid:uuid},function(err,results){
					callback(err,results);
				})
			}
		],
		function(err,results){
			if(err) {
				console.log(err);
			}
			controllerCallback(err,results);
		});
};

module.exports.model = new Experiment();