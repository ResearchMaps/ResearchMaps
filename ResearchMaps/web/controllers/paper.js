var paper = require('../models/paper.js')
, async = require('async')
, types = require('./Types.json')
, http = require('https')
, xml2json = require('xml2js')
, dust = require('dustjs-linkedin');

function Paper(){

};
Paper.prototype.deletePaper = function(request,response){
	paper.model.deletePaper(request.session.username,request.query.title,function(err,result){
		if(err)
			response.json(err);
		else
			response.json(result);
	});
};
Paper.prototype.autocomplete = function(request,response){
	
	paper.model.autocomplete(request.session.username,request.query.term,function(err,result){
		if(err)
			response.json("Error: " + err);
		else{
			
			var resultArray = [];
			result.forEach(function(element){
				console.log(element["p"]["_data"]["data"]);
				resultArray.push(element["p"]["_data"]["data"]);
			});
			response.json(resultArray);
		}
	});
};

Paper.prototype.getAllPapers = function(request,response){

	params = {
		username:request.session.username
	};

	paper.model.getAllPapers(params,function(err,result){
		if(err)
			response.json("Error: " + err);
		else{
			var resultArray = [];
			result.forEach(function(element){
				var title = element["b"]["_data"]["data"]["title"];
				var uuid = element["b"]["_data"]["data"]["uuid"];
				var authors = element["b"]["_data"]["data"]["authors"];
				var journal = element["b"]["_data"]["data"]["journal"];
                var isAdmin = request.session.editorStatus;
                var private = !element["b"]["_data"]["data"]["public"];
				//console.log(element["b"]["_data"]["data"]);
				var obj={};
				obj["title"] = title;
				obj["authors"] = authors;
				obj["uri"] = encodeURIComponent(uuid);
				obj["journal"] = journal;
                obj.isAdmin = isAdmin;
                obj.private = private;
				resultArray.push(obj);
			});
			console.log(JSON.stringify(resultArray));
			dust.render("paper",
				{_csrf:request.session._csrf,papers:resultArray},
				function(err,html){
					response.send(html);
				}
			);
		}
	});
}

Paper.prototype.autocompletePubMed = function(request,response){
	var query_term = request.query.term;
	//Get ID list from esearch
	var req = {
		hostname:"https://eutils.ncbi.nlm.nih.gov",
		port:80,
		path:"/entrez/eutils/esearch.fcgi?db=pubmed&term=" + encodeURIComponent(query_term),
		method:"GET"
	};
	
	async.series([
		function(callback){
			console.log(parseInt(query_term));
			if(!isNaN(query_term)){
				callback(null,new Array(new Array(query_term)));
				return;
			}
			console.log(req.hostname+req.path);
			http.get(req.hostname + req.path,function(res){
				//Got XML request. Transform to object
				var output='';

				res.on('data', function (chunk) {
					output += chunk;
				});

				res.on('end', function() {

					xml2json.parseString(output,function(err,result){
						if(err)
							response.json(err);
						else{
							console.log(result);
							if(result["eSearchResult"]["Count"][0] === '0')
								callback("No results found",null);
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
			req.path="/entrez/eutils/esummary.fcgi?db=pubmed&version=2.0&id=";
			var idlist="";
			var length = result[0].length > 20 ? 20 : result[0].length;
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
					console.log(output);
					//response.send(output);
					xml2json.parseString(output,function(err,result){

						if(err)
							response.json(err);
						else{
							var papers = [];
							result["eSummaryResult"]["DocumentSummarySet"][0]["DocumentSummary"].forEach(function(paper){
								var paperObj = {};
								var authorList = [];
								if(paper["Authors"][0]["Author"]){
									paper["Authors"][0]["Author"].forEach(function(author){
										authorList.push(author["Name"][0]);
									});
								}
								paperObj["authors"] = authorList; 
								paperObj["title"] = paper["Title"][0];
								paperObj["journal"] = paper["FullJournalName"];
								paperObj["pubDate"] = paper["PubDate"];
								paperObj["volume"] = paper["Volume"];
								paperObj["issue"] = paper["Issue"];
								paperObj["page"] = paper["Page"];
								var PMID = paper["ArticleIds"][0]["ArticleId"].filter(function(element){
									if(element["IdType"][0] === "pubmed")
										return true;
									return false;
								})
								paperObj["PMID"] = PMID[0]["Value"][0];
								papers.push(paperObj);
							});
							console.log(JSON.stringify(papers));
							response.json(papers);
						}
			
					});
					
				}); 
			});
		}
	);
}

Paper.prototype.addPaper = function(request,response){
	
	var data = {
		"index":["title",request.body.title],
		"abstract":(request.body.abstract!==null && request.body.abstract!==undefined)?request.body.abstract:"",
		"authors":(request.body.authors!==null&&request.body.authors!==undefined)?request.body.authors:"",
		"journal":(request.body.journal!==null&&request.body.journal!==undefined)?request.body.journal:""
	};
	
	var source = {
		nodeType:types.node.USER,
		index:["username",request.session.username]
	};
	var destination = {
		nodeType:types.node.PAPER,
		index:["title",request.body.title]
	};
	console.log(request.body.isPrivate);
	paper.model.addPaper(request.body.isPrivate,data,source,destination,function(err,uuid){
		if(err){
			var errObj = {};
			errObj["error"] = err;
			if(err === "Already Exists")
				errObj["uri"] = '/paper/' + uuid + '/experiment/all';
			response.json(errObj);
		}
		else{
			response.json({"uri":'/paper/' + uuid + '/experiment/all/new'});
		}
	});
}

Paper.prototype.getPaper = function(request,response){
	var data = {
		title:request.query.title
	};
	paper.model.getPaper(data,function(err,result){
		if(err){
			response.json(err);
		}
		if(!result)
			response.json("Couldn't find the paper");
		else{
			var sendData = {
				title:result.title,
				abstract:result.abstract,
				authors:result.authors,
				journal:result.journal
			};
			response.json(sendData);
		}
	});
}

module.exports.controller = new Paper();