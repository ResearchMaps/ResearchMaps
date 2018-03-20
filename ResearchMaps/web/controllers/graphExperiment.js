var dust = require('dustjs-linkedin')
, experiment = require('../models/graphExperiment.js')
, Article = require('../models/article.js')
, Svg = require('../models/svg.js');
var fs = require('fs');
var Maps = require('../utility/maps.js');

function Experiment(){};

Experiment.prototype.editMultipleExperiment = function(request,response, callback){
    var hasCallback = Maps.has(callback);
    console.log(JSON.stringify(request.body));
    console.log("Done");
    var experimentData =
    {
        Agent:request.body.experiment["WhatAgent"],
        AgentApproach:request.body.experiment["AgentApproach"],
        Manipulation:request.body.experiment["Manipulation"],
        Target:request.body.experiment["WhatTarget"],
        TargetApproach:request.body.experiment["TargetApproach"],
        Result:request.body.experiment["Result"]
    };

    if(request.body.experiment["WhatSecondAgent"]){
        experimentData.WhatSecondAgent = request.body.experiment["WhatSecondAgent"];
        experimentData.WhenSecondAgent = request.body.experiment["WhenSecondAgent"];
        experimentData.WhereSecondAgent = request.body.experiment["WhereSecondAgent"];
        experimentData.SecondManipulation = request.body.experiment["SecondManipulation"];
        experimentData.SecondAgentApproach = request.body.experiment["SecondAgentApproach"];
    }

    var agent = {
        "What":request.body.experiment["WhatAgent"],
        "Where":request.body.experiment["WhereAgent"],
        "When":request.body.experiment["WhenAgent"],
    };

    if(!agent["Where"])
        agent["Where"]="";
    if(!agent["When"])
        agent["When"]="";

    var target = {
        "What":request.body.experiment["WhatTarget"],
        "Where":request.body.experiment["WhereTarget"],
        "When":request.body.experiment["WhenTarget"],
    };

    if(!target["Where"])
        target["Where"]="";
    if(!target["When"])
        target["When"]="";

    var paper = {
        "uuid":request.body.paper.uuid
    };
    experiment.model.editExperiment(request.body.experiment["uuid"],
        request.session.username,
        paper,
        experimentData,
        agent,
        target,
        function(err,results){

            if (hasCallback) {
                callback(err, results);
                return;
            }

            if(err)
                response.json(err);
            else
                response.json("Success");
        }
    );
};

Experiment.prototype.editExperiment = function(request,response){
	console.log(JSON.stringify(request.body));
	console.log("Done");
	var experimentData =
	{
		Agent:request.body.experiment["WhatAgent"],
		AgentApproach:request.body.experiment["AgentApproach"],
		Manipulation:request.body.experiment["Manipulation"],
		Target:request.body.experiment["WhatTarget"],
		TargetApproach:request.body.experiment["TargetApproach"],
		Result:request.body.experiment["Result"],
        StatisticalTest:request.body.experiment["StatTest"],
		Pvalue:request.body.experiment["pvalue"],
		FoldChange:request.body.experiment["foldChange"]
	};

	if(request.body.experiment["WhatSecondAgent"]){
		experimentData.WhatSecondAgent = request.body.experiment["WhatSecondAgent"];
		experimentData.WhenSecondAgent = request.body.experiment["WhenSecondAgent"];
		experimentData.WhereSecondAgent = request.body.experiment["WhereSecondAgent"];
		experimentData.SecondManipulation = request.body.experiment["SecondManipulation"];
		experimentData.SecondAgentApproach = request.body.experiment["SecondAgentApproach"];
	}

	var agent = {
		"What":request.body.experiment["WhatAgent"],
		"Where":request.body.experiment["WhereAgent"],
		"When":request.body.experiment["WhenAgent"],
	};

	if(!agent["Where"])
		agent["Where"]="";
	if(!agent["When"])
		agent["When"]="";

	var target = {
		"What":request.body.experiment["WhatTarget"],
		"Where":request.body.experiment["WhereTarget"],
		"When":request.body.experiment["WhenTarget"],
	};

	if(!target["Where"])
		target["Where"]="";
	if(!target["When"])
		target["When"]="";

	var paper = {
		"uuid":request.body.paper.uuid
	};
	experiment.model.editExperiment(request.body.experiment["uuid"],
		request.session.username,
		paper,
		experimentData,
		agent,
		target,
		function(err,results){
			if(err)
				response.json(err);
			else
				response.json("Success");
		}
	);
};

Experiment.prototype.deleteExperiment = function(request,response){

	experiment.model.deleteExperiment(request.session.username,request.params.uuid,function(err,results){
		if(err)
			response.json(err);
		else
			response.json(results);
	});

};

Experiment.prototype.getExperiments = function(request,response){
	var agent = {
		"What":request.query.agentWhat,
		"When":request.query.agentWhen,
		"Where":request.query.agentWhere
	};
	var target = {
		"What":request.query.targetWhat,
		"When":request.query.targetWhen,
		"Where":request.query.targetWhere
	};
	experiment.model.getExperiments(agent,target,function(err,results){
		if(err)
			response.json(err);
		else{
			console.log(JSON.stringify(results));
			response.json(results);
		}
	})
}
Experiment.prototype.graph = function(request,response){

    

   

    var revert = function() {


		//console.log(decodeURIComponent(request.query.title));
		//rendered = rendered.split('</svg>')[0].append('<script xlink:href="js/SVGPan.js"/></svg>');
		experiment.model.graph(request.session.username, request.params.uuid, function (err, rendered, experiments, paper) {
			console.log("Error is " + JSON.stringify(err));
			if (err)
				response.json(err);
			else {
				if (rendered !== null) {
					//clipboard.clear();
					//clipboard.copy(rendered.toString());
					fs.writeFile("svg_mine.txt", rendered.toString(), function (err) {
						if (err) {
							console.log(err);
						} else {
							console.log("The file was saved!");
						}
					});

					console.log(rendered.toString());
					rendered = rendered.toString().split('</svg>')[0].concat('<script xlink:href="/js/SVGPan.js"></script></svg>');
					rendered = new Buffer(rendered);
				}
				console.log(JSON.stringify(rendered));
				console.log(paper);
				var opts = {};
				opts._csrf = null;
				opts.title = paper["title"];
				opts.authors = paper["authors"];
				opts.journal = paper["journal"];
				opts.uuid = paper.uuid;
				opts.svg = rendered;
				opts.results = experiments;
				dust.render('addExperiment', opts
					/*dust.render('addExperiment',
					 {
					 _csrf:request.csrfToken(),
					 title:paper["title"],
					 authors:paper["authors"],
					 journal:paper["journal"],
					 uuid:paper.uuid,
					 svg:rendered,
					 results:experiments
					 }*/,
					function (err, html) {
						if (err)
							response.send(err);
						else
							response.send(html);
						//console.log(html);
					}
				);
			}
		});
	}

	// workflow:
	// load article --> article loaded (event) --> load svg --> svg loaded (event) --> load dust --> dust loaded (event) --> return results

	// event chain:
	// article loaded --> svg loaded --> dust loaded

	var uname = request.session.username;
	var uuid = request.params.uuid;

	//---- dust loaded ----------------------------------------------
	var onDustLoad = function(err, html) {
		if(err) { response.send(err); } else { response.send(html); }
	};

	//---- svg loaded ----------------------------------------------
	var onSvgLoad = function(event) {

		var article = event.article;
		var svg = event.svg;

		var dustOptions = {};
		dustOptions._csrf = null;
		dustOptions.title = article.title;
		dustOptions.authors = article.authors;
		dustOptions.journal = article.journal;
		dustOptions.uuid = article.uuid;
		dustOptions.isOwner = article.isOwner;
		dustOptions.svg = svg.toBuffer();
		dustOptions.results = article.getExperiments();
        dustOptions.resultsStr = JSON.stringify(article.getExperiments());
		dust.render('addExperiment', dustOptions, onDustLoad);
	};

	//---- article loaded ----------------------------------------------
	var onArticleLoad = function(event) {
		var article = event.article;
		var svg = new Svg();
		var appendEvent = {};
		appendEvent.article = article;
		svg.loaded(onSvgLoad).append(appendEvent);
		var dot = article.toDot();
	//	if (article.relationshipType == null) {
			//revert();
			//return;
			//dot = "";
	//	}
		svg.loadDot(dot);
	};

	var article = new Article();
	article.loaded(onArticleLoad);
	article.revert(revert);
	article.load(uname, uuid);
	//revert();
};

Experiment.prototype.graphNew = function(request,response){
	
	//console.log(decodeURIComponent(request.query.title));
	//rendered = rendered.split('</svg>')[0].append('<script xlink:href="js/SVGPan.js"/></svg>');
	experiment.model.graph(request.session.username,request.params.uuid,function(err,rendered,experiments,paper){
		console.log("Error is " + JSON.stringify(err));
		if(err)
			response.json(err);
		else{
			if(rendered!== null){
				//clipboard.clear();
				//clipboard.copy(rendered.toString());
				fs.writeFile("svg_mine.txt", rendered.toString(), function(err) {
					if(err) {
						console.log(err);
					} else {
						console.log("The file was saved!");
					}
				});

				console.log(rendered.toString());
				rendered = rendered.toString().split('</svg>')[0].concat('<script xlink:href="/js/SVGPan.js"></script></svg>');
				rendered = new Buffer(rendered);
			}
			console.log(JSON.stringify(rendered));
			console.log(paper);
			var opts = {};
			opts._csrf= null;
			opts.title=paper["title"];
			opts.authors=paper["authors"];
			opts.journal=paper["journal"];
			opts.uuid=paper.uuid;
			opts.svg=rendered;
			opts.results=experiments;
			opts.isOwner = true;
			dust.render('addExperiment', opts
				/*dust.render('addExperiment',
				 {
				 _csrf:request.csrfToken(),
				 title:paper["title"],
				 authors:paper["authors"],
				 journal:paper["journal"],
				 uuid:paper.uuid,
				 svg:rendered,
				 results:experiments
				 }*/,
				function(err,html){
					if(err)
						response.send(err);
					else
						response.send(html);
					//console.log(html);
				}
			);
		}
	});
};

Experiment.prototype.addExperiment = function(request,response){
	
	var paperData = {uuid:request.params.uuid};
	var experimentData =
	{
		Agent:request.body.WhatAgent,
		AgentApproach:request.body.AgentApproach,
		Manipulation:request.body.Manipulation,
		Target:request.body.WhatTarget,
		TargetApproach:request.body.TargetApproach,
		Result:request.body.Result,
		StatisticalTest:request.body.StatTest,
        Pvalue:request.body.pvalue,
		FoldChange:request.body.foldChange
	};
	var setOptionalProperties = function(obj,key){
		if(obj[key])
			experimentData[key] = obj[key];
	}
	var optionalPropArr = [
		"WhatAgentDesc","WhereAgentDesc","WhenAgentDesc","WhatTargetDesc","WhereTargetDesc","WhenTargetDesc",
		"Manipulation","Result","WhatSecondAgentDesc","WhereSecondAgentDesc","WhenSecondAgentDesc"
	];
	
	for(var index = 0; index < optionalPropArr.length;index++)
		setOptionalProperties(request.body,optionalPropArr[index]);

	if(request.body.WhatSecondAgent){
		experimentData.WhatSecondAgent = request.body.WhatSecondAgent;
		experimentData.WhenSecondAgent = request.body.WhenSecondAgent;
		experimentData.WhereSecondAgent = request.body.WhereSecondAgent;
		experimentData.SecondManipulation = request.body.SecondManipulation;
		experimentData.SecondAgentApproach = request.body.SecondAgentApproach;
	}

	var agent = {
		What:request.body.WhatAgent,
		Where:request.body.WhereAgent,
		When:request.body.WhenAgent
	};
	
	var target = {
		What:request.body.WhatTarget,
		Where:request.body.WhereTarget,
		When:request.body.WhenTarget
	};

	experiment.model.addExperiment(request.session.username,paperData,experimentData,agent,target,function(err,result){
		if(err)
			response.json("Not authorized");
		else
			response.redirect('/paper/' + request.params.uuid + '/experiment/all');
	});
};

Experiment.prototype.highlightExperiment = function(request,response){
	console.log(JSON.stringify(request.body));
	var username = request.session.username;
	var uuid = request.body.uuid;
	experiment.model.highlightExperiment(username,uuid,function(err,results){
		if(err) {
			response.json(err);
		}
		else {
			response.json(results);
		}
	});
};

module.exports.controller = new Experiment();