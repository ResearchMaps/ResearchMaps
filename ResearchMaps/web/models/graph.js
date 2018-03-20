/**
 * Uses the graphviz interface for node.js to create the graphs(SVG) by taking data from neo4j.
 * @module Graph
 */

var graphviz = require('graphviz')
, dust = require('dustjs-linkedin')
, ScoringSystem = require('./ScoringSystem.js');

/**
* A class that defines two methods: create and make to draw graphs for Map page and  the add experiments page.
* @class Graph
* @constructor
*/
function isEmptyObject(obj) {
  return !Object.keys(obj).length;
}

function Graph(){
	
};

var addNodeIfNotExists = function(g,Node,nodeList,gNodeList){
	if(nodeList.indexOf(Node) === -1){
		var n1 = g.addNode(Node);
		//n1.set("shape","none");
		//n1.set("color","white");
		n1.set("labelloc","b");
		nodeList.push(Node);
		gNodeList.push(n1);
		return n1;
	}
	return null;
};

var addEdgeIfNotExists = function(g,edgeList,source,destination,rType,rScore,areAllHypothetical){
	//console.log(source[0],",",destination[0]);
	var Edge = [source[0],destination[0]];
	//console.log("Check if edge already added");
	if(edgeList[Edge] === undefined && rType!=="None"){
		var e1 = g.addEdge(source[1],destination[1]);
		if(rType === "Inhibitory")
			e1.set("arrowhead","tee");
		else if(rType === "No Relation"){
			e1.set("style","dashed");
			e1.set("arrowhead","dot");
		}
		if (areAllHypothetical) {
			e1.set("label", "");
			e1.set("color", "#CDCDCD");
			e1.set("penwidth", "2");
		}
		else {
			e1.set("label", rScore);
		}
		//e1.set("headport","w");
		edgeList[Edge] = e1;
	}
	else if(edgeList[Edge] !== undefined)
		edgeList[Edge].set("label",rScore);
};

/**
 * Draws a graph from the data received from neo4j.
 * Uses virtualized scores and not the real ones from the DB.
 * Used in the page where we enter experiments.
 *
 * @method create
 * @async
 * @param {Object[]} results The data received from neo4j.
 * @param {Function} callback calling function's callback to be executed once the graph is drawn or an error is encountered.
 * @return None
 */

Graph.prototype.create = function(results,callback){
	var start = new Date();
	var g = graphviz.digraph("G");
	g.set("rankdir","LR");
	g.set("id","viewport");
	var nodeList = [];
	var gNodeList = [];
	var edgeList = [];
	var gEdgeList = [];
	var scoreList = {};
	ScoringSystem.initializeList();
	results.forEach(function(element){
		//console.log(JSON.stringify(element["r"]["_data"]));
		//console.log(JSON.stringify(element["m"]["_data"]["data"]["What"]));
		//console.log(JSON.stringify(element["n"]["_data"]["data"]["What"]));

		var Node = element["m"]["_data"]["data"]["What"];
		Node = Node + "\n";
		if(element["m"]["_data"]["data"]["Where"]!=null && element["m"]["_data"]["data"]["Where"]!="")
			Node = Node + element["m"]["_data"]["data"]["Where"];
		Node = Node + "\n";
		if(element["m"]["_data"]["data"]["When"]!=null && element["m"]["_data"]["data"]["When"]!="")
			Node = Node + element["m"]["_data"]["data"]["When"];

		var NextNode = element["n"]["_data"]["data"]["What"];
		NextNode = NextNode + "\n";
		if(element["n"]["_data"]["data"]["Where"]!=null && element["n"]["_data"]["data"]["Where"]!="")
			NextNode = NextNode + element["n"]["_data"]["data"]["Where"];
		NextNode = NextNode + "\n";
		if(element["n"]["_data"]["data"]["When"]!=null && element["n"]["_data"]["data"]["When"]!="")
			NextNode = NextNode + element["n"]["_data"]["data"]["When"];

		var rScore = element["r"]["_data"]["data"]["score"];
		if(rScore !== undefined){
			//console.log("rScore is " + rScore);
			/*rScore = JSON.parse(rScore);
			var score = ScoringSystem.calculateScore(rScore);
			*/
			var edge = [Node,NextNode];
			var gNode = addNodeIfNotExists(g,Node,nodeList,gNodeList);
			var gNextNode = addNodeIfNotExists(g,NextNode,nodeList,gNodeList);
			var key = [Node,NextNode];
			var experiment = element["a"]["_data"]["data"];
			//console.log("Calculating scores");
			var scoreObject = ScoringSystem.virtualScore(key,experiment);
			//console.log("Done");
			if(gNode === null){
				gNode = gNodeList[nodeList.indexOf(Node)];
			}
			if(gNextNode === null){
				gNextNode = gNodeList[nodeList.indexOf(NextNode)];
			}
			//console.log(labels);
			addEdgeIfNotExists(g,edgeList,[Node,gNode],[NextNode,gNextNode],experiment.conclusion,scoreObject.score+scoreObject.label);
		}
	});
	//console.log(JSON.stringify(scoreList));
	//console.log(JSON.stringify(nodeList));
	var beforeSVGrender = new Date();
	//console.log(JSON.stringify(edgeList));
	g.output( "svg", 
		function(rendered){
			var afterSVGrender = new Date();
			var renderTime = afterSVGrender - beforeSVGrender;
			var scriptTime = beforeSVGrender - start;
			console.log("Render time is " + renderTime);
			console.log("Generate dot script time is " + scriptTime);
			callback(null,rendered);
		},
		function(code,out,err){
		callback(err);
	});
};

/**
 * Draws a graph from the data received from neo4j.
 * Uses real scores and not the virtual ones.
 * Used by the Map page to search for maps.
 * @method make
 * @async
 * @param {Object[]} results The data received from neo4j. Used in the page where we enter experiments.
 * @param {Object} input Specifies the minimum and maximum score to be used for each path.
 * @param {Function} callback calling function's callback to be executed once the graph is drawn or an error is encountered.
 * @return None
 */
 Graph.prototype.make = function(results,input,coalesce,relabelMap,callback){
	var g = graphviz.digraph("G");
	g.set("rankdir","LR");
	g.set("id","viewport");
	var nodeList = [];
	var edgeList = [];
	var gNodeList = [];
	var minimum = input.minimum;
	var maximum = input.maximum;
	if(!minimum)
		minimum = 0;
	if(!maximum)
		maximum = 1;
	console.log("Scores are " + JSON.stringify(input));
	console.log("Minimum is " + minimum);
	console.log("Maximum is " + maximum);
	var isGraphEmpty = true;
	var scoreList = {};
	var merge = false;

	results = results.filter(function(path){
		for(var i=0;i<path.What.length-1;i++){
			var rScore = JSON.parse(path.rScore[i]);
			var score = ScoringSystem.calculateScore(rScore);
			if(score.max < minimum || score.max > maximum)
				return false;
		}
		return true;
	});
	var edges = {};
	results.forEach(function(path){
		var i;
		for(i=0;i<path.What.length-1;i++){
			var n1;
			var Node = path.What[i];
			var edge = {};
			edge["agent"]={};
			edge["target"]={};

			edge["agent"]["What"] = Node;
			Node = Node + "\n";
			if(path.Where[i]!=null && path.Where[i]!=""){
				Node = Node + path.Where[i];
				edge["agent"]["Where"] = path.Where[i];
			}
			else
				edge["agent"]["Where"] = "";
			Node = Node + "\n";

			if(path.When[i]!=null && path.When[i]!=""){
				Node = Node + path.When[i];
				edge["agent"]["When"] = path.When[i];
			}
			else
				edge["agent"]["When"] = "";

			var NextNode = path.What[i+1];
			edge["target"]["What"] = path.What[i+1];

			NextNode = NextNode + "\n";
			if(path.Where[i+1]!=null && path.Where[i+1]!=""){
				NextNode = NextNode + path.Where[i+1];
				edge["target"]["Where"] = path.Where[i+1];
			}
			else
				edge["target"]["Where"] = "";

			NextNode = NextNode + "\n";
			if(path.When[i+1]!=null && path.When[i+1]!=""){
				NextNode = NextNode + path.When[i+1];
				edge["target"]["When"] = path.When[i+1];
			}
			else
				edge["target"]["When"] = "";

			var rScore = path.rScore[i];
			// Get scores of all experiments.
			rScore = JSON.parse(rScore);
			// Get scores of only hypothetical experiments.
			var hypScoreObj = JSON.parse(path['hypScore'][0]);

			// Are all the experiments hypothetical?
			var rScoreString = path['rScore'][0];
			var hypScoreString = path['hypScore'][0];
			var areAllHypothetical = false;
			if (rScoreString === hypScoreString) {
				areAllHypothetical = true;
			}
			
			// Function to discount all-experiment score tally per
			// number of hypothetical experiments of matching type.
			var discountForHypotheticals = function(evidenceType,manipulationType) {
				// Get number of all experiments (empirical + hypothetical)
				var allN = rScore[evidenceType][manipulationType].n;
				// Get number of hypothetical experiments.
				var hypN = hypScoreObj[evidenceType][manipulationType].n;
				// If there are any hypothetical experiments...
				if (hypN > 0) {
					// Calculate number of empirical experiments.
					var empN = allN - hypN;
					// Set number of empirical experiments (excluding hypothetical experiments).
					rScore[evidenceType][manipulationType].n = empN;
					// Calculate score (including empirical experiments only).
					rScore[evidenceType][manipulationType].score = 0;
					for(idx = 0; idx < empN; idx++) {
						rScore[evidenceType][manipulationType].score += 0.125 * Math.pow(0.5, idx);
					}
				}
			};
			
			// If there are both empirical and hypothetical experiments,
			// discount the empirical scores so that hypothetical experiments
			// don't contribute anything to the scores.
			if (!areAllHypothetical && !(hypScoreObj == null)) {
				discountForHypotheticals("Excitatory","Positive");
				discountForHypotheticals("Excitatory","Negative");
				discountForHypotheticals("Excitatory","Non-Intervention");
				discountForHypotheticals("Excitatory","Mediation");
				discountForHypotheticals("Inhibitory","Positive");
				discountForHypotheticals("Inhibitory","Negative");
				discountForHypotheticals("Inhibitory","Non-Intervention");
				discountForHypotheticals("Inhibitory","Mediation");
				discountForHypotheticals("No Relation","Positive");
				discountForHypotheticals("No Relation","Negative");
				discountForHypotheticals("No Relation","Non-Intervention");
				discountForHypotheticals("No Relation","Mediation");
			}
			var score = ScoringSystem.calculateScore(rScore);

			var key = Node + "\n" + NextNode;
			edge["score"] = score;
			edge["rScore"] = rScore;
			
			edge["areAllHypothetical"] = areAllHypothetical;
			edges[key] = edge;
		}
	});
	var mergedEdges = {};
	for(var key in edges){
		var mapKey,agent,target;

		if(relabelMap!==undefined && !isEmptyObject(relabelMap)){
			if(relabelMap[edges[key]["agent"]["What"]])
				edges[key]["agent"]["What"] = relabelMap[edges[key]["agent"]["What"]];
			if(relabelMap[edges[key]["target"]["What"]])
				edges[key]["target"]["What"] = relabelMap[edges[key]["target"]["What"]];
		}

		if(coalesce){
			agent = edges[key]["agent"]["What"]+"\n\n";
			target = edges[key]["target"]["What"] + "\n\n";
		}
		else{
			agent = edges[key]["agent"]["What"] + "\n" + edges[key]["agent"]["Where"] + "\n" + edges[key]["agent"]["When"];
			target = edges[key]["target"]["What"] + "\n" + edges[key]["target"]["Where"] + "\n" + edges[key]["target"]["When"];
		}
		mapKey = agent + target;
		var rScore = edges[key]["rScore"];
		if(scoreList[mapKey] === undefined){
			scoreList[mapKey] = rScore;
		}
		else{
			for(var conclusion in scoreList[mapKey]){
				for(var experimentType in scoreList[mapKey][conclusion]){
					//debugger;
					scoreList[mapKey][conclusion][experimentType]["n"] = scoreList[mapKey][conclusion][experimentType]["n"] 
																+ rScore[conclusion][experimentType]["n"];
					scoreList[mapKey][conclusion][experimentType]["score"] = 0; 
					for(var exponent = 0;exponent<scoreList[mapKey][conclusion][experimentType]["n"];exponent++)
						scoreList[mapKey][conclusion][experimentType]["score"] += 0.125*Math.pow(0.5,exponent);
				}
			}
		}
		score = ScoringSystem.calculateScore(scoreList[mapKey]);
		mergedEdges[mapKey] = {};
		mergedEdges[mapKey]["agent"] = agent;
		mergedEdges[mapKey]["target"]= target;
		mergedEdges[mapKey]["score"] = score;
		mergedEdges[mapKey]["areAllHypothetical"] = edges[key]["areAllHypothetical"];
	}
	
	for(var key in mergedEdges){
		var edge = mergedEdges[key];
		var Node = edge["agent"];
		var NextNode = edge["target"];
		var score = edge["score"];
		var areAllHypothetical = mergedEdges[key]["areAllHypothetical"];
		
		if(score.max === 0)
			continue;

		var gNode=addNodeIfNotExists(g,Node,nodeList,gNodeList);
		if(gNode === null)
			gNode = gNodeList[nodeList.indexOf(Node)];
	
		var gNextNode=addNodeIfNotExists(g,NextNode,nodeList,gNodeList);
		if(gNextNode === null)
			gNextNode = gNodeList[nodeList.indexOf(NextNode)];
		isGraphEmpty = false;
		addEdgeIfNotExists(g,edgeList,[Node,gNode],[NextNode,gNextNode],score.rType,score.max + score.label,areAllHypothetical);
	}
	
	//console.log(JSON.stringify(edgeList));
	//console.log(g.to_dot());
	//callback(null,g.to_dot());
	if(isGraphEmpty === false){
		g.output("svg",
			function(rendered){
				callback(null,rendered);
			},
			function(code,out,err){
				callback(err);
			}
		);
	}
	else
		callback(null,null);
};
module.exports = new Graph(); 