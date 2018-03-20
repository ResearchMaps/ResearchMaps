/**
 * Provides the paper class used to query the neo4j database for papers
 * @module paper
 */
var DB = require('./DBobject.js')
, graphDB = DB.graphDB
, async = require('async')
, types = require('./Types.json')
, http = require('http')
, parseString = require('xml2js').parseString
, uuid = require('node-uuid')
, graphExperiment = require('./graphExperiment.js').model;

var Article = require('./article.js');

/**
* A class to add/get papers from the neo4j database and to provide autocomplete suggestions.
* @class Paper
* @constructor
*/
function Paper(){
};

Paper.prototype.deletePaper = function(username,title,controllerCallback){
	var query = [
		"MATCH (u:User)-[:adds]->(p:Paper)-[:consistsOf*0..1]->(e)",
		"WHERE u.username={username} AND p.title={title}",
		"RETURN p,e;"
	].join("\n");
	
	var params = {
		"username":username,
		"title":title
	};

	graphDB.instance.query(query,params,function(err,results){
		if(err)
			controllerCallback(err,null);
		else if(results.length === 0)
			controllerCallback("no results found",null);
		else{
			results.forEach(function(node){
				console.log(JSON.stringify(node["e"]["_data"]["data"]));
			});
			async.eachSeries(results,
				function(node,callback){

					if(node["e"]["_data"]["data"]["title"] === undefined)
						graphExperiment.deleteExperiment(username,node["e"]["_data"]["data"]["uuid"],callback);
					else
						callback(null,null);
				},
				function(err){
					console.log("2");
					if(err)
						controllerCallback(err,null);
					else{
						var query = [
							"MATCH (u:User)-[r:adds]->(p:Paper)",
							"WHERE p.title={title}",
							"DELETE r,p"
						].join("\n");
						var params = {
							"title":title
						};
						graphDB.instance.query(query,params,function(err,results){
							if(err)
								controllerCallback(err,null);
							else
								controllerCallback(null,"Success");
						});
					}
				}
			);
		}
	});
};
/**
 * Autocomplete functionality for the Articles page.
 *
 * @method autocomplete
 * @async
 * @param {String} username Specifies the username.
 * @param {String} searchTerm the autocomplete query from user.
 * @param {Function} controllerCallback calling function's callback to be executed once the papers are found or error is encountered.
 * @return None
 */
Paper.prototype.autocomplete = function(username,searchTerm,controllerCallback){
	var params={
		username:username,
		regex:"(?i).*" + searchTerm + ".*"
	};
	
	var query = [
		"match (u:User)-[r:adds]->(p:Paper)",
		"where (u.username={username} or u.username='public') AND (p.title=~{regex} OR p.authors=~{regex} OR p.journal=~{regex})",
		"return p"
	].join("\n");
	graphDB.instance.query(query,params,controllerCallback);
};

/**
 * Get all papers that are either in the public database or in the user's private database.
 *
 * @method getAllPapers
 * @async
 * @param {Object} params Specifies the username.
 * @param {Function} controllerCallback calling function's callback to be executed once the papers are found or error is encountered.
 * @return None
 */
Paper.prototype.getAllPapers = function(params,controllerCallback){

	var query = [
		"MATCH (a:" + types.node.USER + "),(b:" + types.node.PAPER + ")",
		"WHERE (a.username={username} AND a-[:" + types.rel.ADDS + "]->b) OR b.public=true",
		"RETURN distinct b",
        "ORDER BY id(b) DESC"
	].join("\n");

	graphDB.instance.query(query,params,controllerCallback);
}

/**
 * Autocomplete functionality for PubMed. Used later to add papers from PubMed.
 *
 * @method autocompletePubMed
 * @async
 * @param {Object} request request object from node.js
 * @param {Object} response tresponse object from node.js
 * @return None
 */
Paper.prototype.autocompletePubMed = function(request,response){
	var query_term = request.query.term;
	//Get ID list from esearch
	var req = {
		hostname:"http://eutils.ncbi.nlm.nih.gov",
		port:80,
		path:"/entrez/eutils/esearch.fcgi?db=pubmed&term=" + "2013+AND+" + encodeURIComponent(query_term),
		method:"GET"
	};
	console.log(req.hostname+req.path);
	async.series([
		function(callback){
			http.get(req.hostname + req.path,function(res){
				//Got XML request. Transform to object
				var output='';

				res.on('data', function (chunk) {
					output += chunk;
				});

				res.on('end', function() {

					parseString(output,function(err,result){
						console.log("yes2");
						if(err)
							response.json(err);
						else{
							console.log(result);
							callback(err,result.eSearchResult.IdList[0].Id);
						}
					});                 
				});
			});
		}],
		function(err,result){
			console.log("Yes1");
			if(err){
				response.json(err);
				return;
			}
			//Get paper attributes from pubmed for each id
			req.path="/entrez/eutils/esummary.fcgi?db=pubmed&id=";
			var idlist="";
			var length = result[0].length > 6 ? 6 : result[0].length;
			for (var i = 0; i < length ; i++) {
				idlist = idlist + result[0][i] + ',';
			};
			idlist = idlist.substring(0,idlist.length-1);
			console.log(req.hostname + req.path + idlist);
			http.get(req.hostname + req.path + idlist,function(res){

				var output='';

				res.on('data', function (chunk) {
					output += chunk;
				});

				res.on('end', function(){
					//response.json(output);
					parseString(output,function(err,result){

						if(err)
							response.json(err);
						else{
							//result.eSearchResult.forEach(function(article){

							//})
							response.json(result);
						}
			
					});
					
				}); 
			});
		}
	);
}

/**
 * Add paper to neo4j. Can be added to either the public database(via PubMed) or to the user's private database.
 *
 * @method addPaper
 * @async
 * @param {Boolean} isPrivate Boolean specifying where to add the paper : private DB or public
 * @param {Object} data Stores information about the paper.
 * @param {Object} source specifies the user who adds the paper.
 * @param {Object} destination specifies the paper to be added..
 * @param {Function} controllerCallback calling function's callback to be executed once the paper has been added or error is encountered.
 * @return None
 */
Paper.prototype.addPaper = function(isPrivate,data,source,destination,controllerCallback){
	var publicSource = {
		nodeType:types.node.USER,
		index:["username","public"]
	};
	async.waterfall([
		function(callback){
			var paper = {
				"index":["title",data["index"][1]]
			};
			graphDB.findNode(types.node.PAPER,paper,callback);
		},
		function(node,callback){

			if(node.length > 0)
				controllerCallback("Already Exists",node[0]["node"]["_data"]["data"]["uuid"]);
			else{
				data["uuid"] = uuid.v4();
				graphDB.createNode(types.node.PAPER,data,callback);
			}
		},
		function(results,callback){

			console.log(JSON.stringify(results));

            var article = new Article(results["node"]["_data"]["data"]["uuid"]);

            var fun = function() {
                graphDB.createRelationship(source,destination,types.rel.ADDS,null,null,function(err,res){
                    if(isPrivate === "false"){
                        graphDB.createRelationship(publicSource,destination,types.rel.ADDS,null,null,function(err,res){
                            callback(err,results["node"]["_data"]["data"]["uuid"]);
                        });
                    }
                    else
                        callback(err,results["node"]["_data"]["data"]["uuid"]);
                });
            }

            article.madePrivate(function() { fun(); });
            if (isPrivate === "true") {
				article.makePrivate();
			}
			else {
				article.makePublic();
			}
		}
	],
	controllerCallback);
}

/**
 * Get paper information by searching for title.
 *
 * @method getPaper
 * @async
 * @param {Object} data Specifies the paper title.
 * @param {Function} controllerCallback calling function's callback to be executed once the paper is found or error is encountered.
 * @return None
 */
Paper.prototype.getPaper = function(data,controllerCallback){   
	graphDB.findNode(types.node.PAPER,data,controllerCallback);
}

module.exports.model = new Paper();