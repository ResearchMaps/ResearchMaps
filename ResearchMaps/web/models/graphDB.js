/**
 * Provides the graphDB class used to query the neo4j database
 * using aseemk's neo4j driver(node-neo4j) for node.js(https://github.com/thingdom/node-neo4j).
 * @module graphDB
 */

var neo4j = require('neo4j')
, DBconfig = require('../config/DBconfig.json')
, graphDBinstance = new neo4j.GraphDatabase(DBconfig.neo4jURL)
, fs = require('fs')
, async = require('async');

/**
* An interface to access the common functionalities of neo4j graph database.
* Can't access the driver's API because it supports neo4j v1.4-1.9.
* @class graphDB
* @constructor
*/
function graphDB(){
	this.instance = graphDBinstance;
};

/**
 * Dump the database contents to a comma-separated-value file.
 *
 * @method dumpToCSV
 *
 * @return None
 */
graphDB.prototype.dumpToCSV = function(){
	var query = [
		"match (u:User)-[a]->(p:Paper)-[c]->(e:Experiment)-[Ag]->(agent:NeurolaxTerm)-[g]->(target:NeurolaxTerm)<-[t]-(e:Experiment)",
		"return p,agent,target,g,e;"
	].join("\n");
	this.instance.query(query,null,function(err,results){
		if(err){
			console.log(err);
			return;
		}
		else{
			var getPaperCols = function(paper){
				var str = paper["title"];
				str += ",";
				if(paper["authors"])
					str +=  paper["authors"]; 
				str += ",";
				if(paper["journal"])
					str += paper["journal"];
				return str;
			}
			var getNeurolaxCols = function(neurolaxTerm){
				var str = neurolaxTerm["What"];
				str += ",";
				if(neurolaxTerm["Where"])
					str +=  neurolaxTerm["Where"]; 
				str += ",";
				if(neurolaxTerm["When"])
					str += neurolaxTerm["When"];
				return str;
			}
			async.each(results,function(row,callback){
				var paper = getPaperCols(row["p"]["_data"]["data"]);
				var agent = getNeurolaxCols(row["agent"]["_data"]["data"]);
				var target = getNeurolaxCols(row["target"]["_data"]["data"]);
				var experiment = row["e"]["_data"]["data"];
				str = [
					paper,
					agent,
					experiment["AgentApproach"],
					experiment["Manipulation"],
					target,
					experiment["TargetApproach"],
					experiment["Result"],
					experiment["conclusion"],
					experiment["WhatSecondAgent"]?experiment["WhatSecondAgent"]:"",
					experiment["SecondManipulation"]?experiment["SecondManipulation"]:"",
					experiment["SecondAgentApproach"]?experiment["SecondAgentApproach"]:"",
				].join("|");
				str = str + "\n";
				fs.writeFileSync('DBdump.csv',str,{flag:'a'});
			});
			console.log("File successfully written to DBdump.csv");
		}
	})
}

/**
 * Create a new node of given type and data.
 *
 * @method createNode
 * @async
 * @param {String} nodeType Specifies the node label.
 * @param {Object} data attributes of the node to be created.
 * @param {Function} callback calling function's callback to be executed once the node is created or error is encountered.
 * @return None
 */

graphDB.prototype.createNode = function(nodeType,data,callback){
	var query = ['CREATE (node:' + nodeType.toString() + '{data})',
				 'RETURN node']
				 .join('\n');
	var params = {};
	params["data"] = {};
	for(var key in data){
		if(key === "index"){
			for(var index = 0;index<data["index"].length;index+=2)
				//TODO:Create index in DB
				params["data"][data["index"][index]] = data["index"][index+1]; 
		}
		else
			params["data"][key] = data[key];
	}
	this.instance.query(query,params,function(err,result){
		if(callback === null || callback === undefined)
			return;
		if(err)
			console.log(err);
		console.log("Create result is ");
		console.log(result);
		callback(err, result[0]);
	});
};

/**
 * Create a new node of given type and data if no existing node is found.
 *
 * @method mergeNode
 * @async
 * @param {String} nodeType Specifies the node label.
 * @param {Object} data attributes of the node to be created. Data has an index property(an array)
 * that specifies what property to use to find existing node.
 * @param {Function} callback calling function's callback to be executed once the node is merged or error is encountered.
 * @return None
 */
graphDB.prototype.mergeNode = function(nodeType,data,callback){
	var onCreateString = '';
	var params = {};
	for(property in data){
		if(property === 'index'){
			onCreateString = onCreateString + 'node.' + data.index[0] + ' = {index},';
			params['index'] = data.index[1];
		}
		else if(property !== data.index[0]){
			onCreateString = onCreateString + 'node.' + property + ' = {' + property + '},';
			params[property] = data[property];
		}
	}

	if(onCreateString[onCreateString.length-1] === ',')
		onCreateString = onCreateString.substring(0,onCreateString.length-1);
	
	console.log(onCreateString);

	if(onCreateString !== '')
		onCreateString = ['ON CREATE ',
						   'SET ' + onCreateString]
						   .join('\n');
	
	var query = ['MERGE (node:' + nodeType.toString() + '{' + data.index[0] + ':{index} })',
				 onCreateString,
				 'RETURN node']
				 .join('\n');

	console.log(query);
	console.log(JSON.stringify(params));
	this.instance.query(query,params,function(err,result){
		if(callback === null || callback === undefined)
			return;
		if(err)
			console.log(err);
		console.log("Merge result is ");
		console.log(result);
		callback(err, result[0]);
	});
};

/*graphDB.prototype.createRelationship = function(sourceNode,destinationNode,relType,relData,callback){
	if(sourceNode.createRelationshipTo === null || sourceNode.createRelationshipTo === undefined){
		callback("NaDB",null);
	}
	else{
	sourceNode.createRelationshipTo(destinationNode,relType,relData,function(err,relationship){
			if(callback === null || callback === undefined)
				return;
			callback(err,relationship);
		});
	}
};*/

/**
 * Create a new relationship of given type and data between source and destination nodes.
 *
 * @method createRelationship
 * @async
 * @param {Object} sourceNode the sourceNode from which the directed edge originates. sourceNode has an index property(an array)
 * that specifies what property to use to find source node.
 * @param {Object} destinationNode the destinationNode at which the directed edge terminates. destinationNode has an index property(an array)
 * that specifies what property to use to find destination node.
 * @param {String} relType Specifies the edge label. 
 * @param {Object} relData attributes of the edge to be created. Data has an index property(an array)
 * that specifies what property to use to find existing node.
 * @param {String} setString an optional set string that changes relationship data if a match is found.
 * @param {Function} callback calling function's callback to be executed once the edge is created or error is encountered.
 * @return None
 */
graphDB.prototype.createRelationship = function(sourceNode,destinationNode,relType,relData,setString,callback){
	var srcWhereString = '';
	var dstWhereString = '';
	
	function escape_string (str) {
	    return str.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, function (character) {
	        //console.log("Char is " + character);
	        switch (character) {
	            case "\0":
	                return "\\0";
	            case "\x08":
	                return "\\b";
	            case "\x09":
	                return "\\t";
	            case "\x1a":
	                return "\\z";
	            case "\n":
	                return "\\n";
	            case "\r":
	                return "\\r";
	            case "\"":
	            case "'":
	            case "\\":
	            case "%":
	                return "\\"+character; // prepends a backslash to backslash, percent,
	                                  // and double/single quotes
	        }
	    });
	}
	//TODO: Add escape int method for id
	for (var i = 0; i < sourceNode.index.length; i+=2) {
		if(sourceNode.index[i] == "id")
			srcWhereString = srcWhereString + "id(a) = " + sourceNode.index[i+1] + " AND ";
		else
			srcWhereString = srcWhereString + "a." + sourceNode.index[i] + " = '" + escape_string(sourceNode.index[i+1]) + "' AND ";
	};

	for (var i = 0; i < destinationNode.index.length; i+=2) {
		if(destinationNode.index[i] == "id")
			dstWhereString = dstWhereString + "id(b) = " + destinationNode.index[i+1] + " AND ";
		else
			dstWhereString = dstWhereString + "b." + destinationNode.index[i] + " = '" + escape_string(destinationNode.index[i+1]) + "' AND ";
	};
	//Remove trailing AND in both strings
	if(srcWhereString.length >0)
		srcWhereString = srcWhereString.substring(0,srcWhereString.length-4);
	
	if(dstWhereString.length >0)
		dstWhereString = dstWhereString.substring(0,dstWhereString.length-4);

	var query =["MATCH (a:" + sourceNode.nodeType + "), (b:" + destinationNode.nodeType + ") ",
				"WHERE " + srcWhereString + 
				"AND " + dstWhereString,
				"CREATE UNIQUE a-[r:" +relType + (relData!==null? "{data}":"") + "]->b",
				(setString !== null)?setString:"",
				"RETURN r"].join('\n');
	console.log(query);
	var params = (relData!==null)?{data:relData}:null;
	this.instance.query(query,params,function(err,result){
		if(callback === null || callback === undefined)
			return;
		callback(err, "Success");
	});
}

/**
 * Find existing nodes.
 *
 * @method findNode
 * @async
 * @param {String} label Specifies the node label.
 * @param {Object} data attributes of the node to be found. Data has an index property(an array)
 * that specifies what properties to use to find existing node. Multiple properties are searched using AND clause.
 * @param {Function} callback calling function's callback to be executed once the node is found or error is encountered.
 * @return None
 */
graphDB.prototype.findNode = function(label,data,callback,isCaseInsensitive){
	var whereString = '';
	var params = {};
	for(property in data){
		if(property === "index"){
			for(var index = 0;index<data["index"].length;index+=2){
				var prop = data["index"][index];
				var value = data["index"][index+1];
				if(isCaseInsensitive){
					whereString = whereString + "node." + prop + ' =~ {' + prop + '} AND ';
					params[prop] = '(?i)' + value;
				}
				else{
					whereString = whereString + "node." + prop + ' = {' + prop + '} AND ';
					params[prop] = value;
				}
			}
		}
		else{
			if(isCaseInsensitive){
				whereString = whereString + "node." + property + ' =~ {' + property + '} AND ';
				params[property] = '(?i)' + data[property];
			}
			else{
				whereString = whereString + "node." + property + ' = {' + property + '} AND ';
				params[property] = data[property];
			}
		}
	}

	console.log(whereString);
	var len = whereString.length;
	
	if(whereString !== '' && whereString.substring(len-5,len) === ' AND ')
		whereString = 'WHERE ' + whereString.substring(0,len-5);
	
	var query = [
		'MATCH (node:' + label +')',
		whereString,
		'RETURN node'
	].join('\n');

	console.log(query);
	console.log(JSON.stringify(params));
	this.instance.query(query,params,function(err,result){
		if(callback === null || callback === undefined)
			return;
		callback(err, result);
	});
}

graphDB.prototype.traverse = function(username,sourceNode,destinationNode,relType,numConnections,mode,callback, userOnlyParam){
    var userOnly = userOnlyParam || false;
	console.log("Mode is : " + parseInt(mode));
	console.log(typeof(mode));

    if (userOnly){
        var query =
            [
                "Match (u:User)-[:adds]->(y:Paper)-[:consistsOf]->(e:Experiment)-[:agent]->(m:NeurolaxTerm)",
                "where u.username={username}"
            ].join("\n");
    }
    else {
        var query =
            [
                "Match (u:User)-[:adds]->(y:Paper)-[:consistsOf]->(e:Experiment)-[:agent]->(m:NeurolaxTerm)",
                "where y.public=true OR u.username={username}"
            ].join("\n");
    }

	if(isNaN(parseInt(numConnections)))
		numConnections = 2;
	else
		numConnections = parseInt(numConnections);

	query = 
	[
		query,
		"With m",
		"MATCH p=(m)-[r:" + relType + "*1.." + numConnections + "]->(n:" + destinationNode.nodeType + ")"
	].join("\n");

	var params = {};

	var addSrcWhereString = function(srcWhereString,query,node,params){

		for(var i=0;i<node.index.length;i+=2){
			if(node.index[i+1]){
				srcWhereString = srcWhereString + "m." + node.index[i] + "=~{src" + node.index[i] + "} AND ";
				params["src" + node.index[i]] = '(?i)' + node.index[i+1];
			}
		}
		srcWhereString = srcWhereString.substring(0,srcWhereString.length-4);
		query = [query,srcWhereString].join("\n");
		
		return {
			"query":query,
			"params":params
		};
	}

	var addDstWhereString = function(dstWhereString,query,node,params){

		for(var i=0;i<node.index.length;i+=2){
			if(node.index[i+1]){
				dstWhereString = dstWhereString + "n." + node.index[i] + "=~{dst" + node.index[i] + "} AND ";
				params["dst" + node.index[i]] = '(?i)' + node.index[i+1];
			}
		}
		dstWhereString = dstWhereString.substring(0,dstWhereString.length-4);
		//console.log("dstWhereString is " + dstWhereString);
		query = [query,dstWhereString].join("\n");
		
		return {
			"query":query,
			"params":params
		};
	}
	var res;
	switch(parseInt(mode)){
		case 1://Agent Only

			res = addSrcWhereString("WHERE ",query,sourceNode,params);
			query = res["query"];
			params = res["params"];
			break;

		case 2://Target Only
			
			res = addDstWhereString("WHERE ",query, sourceNode, params);
			query = res["query"];
			params = res["params"];
			break;
		
		case 3://Either Agent or Target
			
			res = addSrcWhereString("WHERE ",query,sourceNode,params);
			query = res["query"];
			params = res["params"];
			res = addDstWhereString("OR ",query, sourceNode, params);
			query =res["query"];
			params = res["params"];

			break;

		case 4: //Both
			
			res = addSrcWhereString("WHERE ",query,sourceNode,params);
			query = res["query"];
			params = res["params"];
			res = addDstWhereString("AND ",query, destinationNode, params);
			query =res["query"];
			params = res["params"];

			break;

		default:
			console.log("unknown mode");
		break;
	}

	params["username"] = username;
	query = [
			query, 
			"RETURN DISTINCT extract(s in relationships(p) | s.score) as rScore",
			",extract(s in relationships(p) | s.hypScore) as hypScore",
			",extract(t in nodes(p) | t.What) as What",
			",extract(t in nodes(p) | t.Where) as Where",
			",extract(t in nodes(p) | t.When) as When"].join("\n");
	console.log(query);
	console.log(JSON.stringify(params));
	this.instance.query(query,params,function(err,result){
		
		if(callback === null || callback === undefined)
			return;
		//console.log(JSON.stringify(result));
		console.log("Calling callback");
		callback(err, result);
	})
}

module.exports.graphDB = new graphDB();