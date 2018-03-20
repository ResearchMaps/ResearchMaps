/**
 * module to perform autocomplete queries and traverse the map in the MAP page.
 * @module NeurolaxTerm
 */

var DB = require('./DBobject.js')
, graphDB = DB.graphDB
, async = require('async')
, types = require('./Types.json')
, http = require('http')
, util = require('util')
, graph = require('./graph.js');

/**
*  class that defines methods to perform autocomplete queries and traver the map.
* @class NeurolaxTerm
* @constructor
*/
function NeurolaxTerm(){};

/**
 * Finds the list of agents/targets that are publicly accessible or from the user.
 *
 * @method mapAutocomplete
 * @async
 * @param {String} username Specifies the username.
 * @param {String} term the autocomplete query from user.
 * @param {Function} controllerCallback calling function's callback to be executed once the nodes are found or error is encountered.
 * @return None
 */
NeurolaxTerm.prototype.mapAutocomplete = function(username,term,controllerCallback){
	var query = 
		[
			"Match (u:User)-[:adds]->(y:Paper)-[:consistsOf]->(e:Experiment)-[]->(m:NeurolaxTerm)",
			"where (y.public=TRUE OR u.username={username}) AND m.What =~ {regex}",
			"Return Distinct m.What as Term"
		].join("\n");

	var params={
		username:username,
		regex:"(?i).*" + term + ".*"
	};
	var _self = this;
	graphDB.instance.query(query,params,function(err,results){
		_self.autocomplete(term,function(res){
			var chunk='';
			res.on('data',function(data){
				chunk+=data;
			});
			res.on('end',function(){
				
				var resObj = JSON.parse(chunk);
				
				resObj.result.forEach(function(element){
					results.push({"Term":element.name.split('|')[0]});
				});
				
				controllerCallback(err,results);
			});
			
		});
	});
};

/**
 * Finds the list of agents/targets that are accessible publicly or from the user.
 *
 * @method search
 * @async
 * @param {String} username Specifies the username.
 * @param {Object} source search attributes of the agent(What/Where/When).
 * @param {Object} destination search attributes of the target(What/Where/When).
 * @param {Object} scores Minimum and maximum scores that the graph can have.
 * @param {String} numConnections the maximum number of connections to/from the agent. Default is 4.
 * @param {Function} controllerCallback calling function's callback to be executed once the nodes are found or error is encountered.
 * @return None
 */
NeurolaxTerm.prototype.search = function(username,source,destination,scores,numConnections,mode,coalesce,relabelMap,controllerCallback, userOnly){
	console.log("Src " + JSON.stringify(source));
	
	var sourceNode = {
		nodeType:types.node.TERM,
		index:["What",source.what]
	};

	var addToIndex = function(array,key,value){
		if(value){
			array.push(key);
			array.push(value);
		}
	};
	
	addToIndex(sourceNode.index,"Where",source.where);
	addToIndex(sourceNode.index,"When",source.when);

	var destinationNode = {
		nodeType:types.node.TERM
	};

	console.log("Target is " + JSON.stringify(destination));

	if(destination && destination.what){
		destinationNode.index=["What",destination.what];
		addToIndex(destinationNode.index,"Where",destination.where);
		addToIndex(destinationNode.index,"When",destination.when);
	}
	
	async.waterfall([
		function(callback){
			graphDB.traverse(username,sourceNode,destinationNode,types.rel.GIVES,numConnections,mode,callback, userOnly);
		},
		function(results,callback){
			if(results.length === 0)
				callback(null,null);
			else
				graph.make(results,scores,coalesce,relabelMap,callback);
			//console.log(JSON.stringify(results));
		}
	],function(err,results){
		controllerCallback(err,results);
	});
}

/**
 * Finds the list of Neurolaxterm from NIF website. Used in the add experiments page to autocomplete user queries.
 *
 * @method autocomplete
 * @async
 * @param {String} term the autocomplete query from user.
 * @param {Function} controllerCallback calling function's callback to be executed once the list is found or error is encountered.
 * @return None
 */
NeurolaxTerm.prototype.autocomplete = function(term,controllerCallback){
	var url = "http://nif-services.neuinfo.org/ontoquest/reconcile?limit=30&query=" + term;
	http.get(url,controllerCallback);
}

module.exports.model = new NeurolaxTerm();