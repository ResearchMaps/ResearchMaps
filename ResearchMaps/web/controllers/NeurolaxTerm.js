var dust = require('dustjs-linkedin')
, neurolax = require('../models/NeurolaxTerm.js');

var Article = require('../models/article.js');
var Svg = require('../models/svg.js');
var Maps = require('../utility/maps.js');

function NeurolaxTerm(){};
NeurolaxTerm.prototype.mapAutocomplete = function(request,response){
	
	neurolax.model.mapAutocomplete(request.session.username,request.query.term,function(err,result){
		if(err)
			response.json(err);
		else{
			response.json(result);
		}
	});

}
NeurolaxTerm.prototype.map = function(request,response){
	dust.render('map',{},function(err,html){
		response.send(html);
	});
};

NeurolaxTerm.prototype.search = function(request,response){
	console.log("Inside search");
	var source = {
		what:request.query.whatSrc,
		when:request.query.whenSrc,
		where:request.query.whereSrc
	};
	var destination = {
		what:request.query.whatDst,
		when:request.query.whenDst,
		where:request.query.whereDst
	};
	//Change below stuff to an options argument with default values.
	var scores = {
		"minimum":request.query.min,
		"maximum":request.query.max
	};
	var numConnections = request.query.numConnections;
	var mode = request.query.mode;
	var coalesce = request.query.coalesce === 'true';
	var relabelMap = request.query.relabelMap;
    var userOnly = request.query.userOnly == "true";

	var searchAgentTarget = Maps.has(request.query.whatDst);

	var params = {};

	if (searchAgentTarget) {
		params.agentWhat = source.what;
		params.agentWhen = source.when;
		params.agentWhere = source.where;
		params.targetWhat = destination.what;
		params.targetWhen = destination.when;
		params.targetWhere = destination.where;
	}
	else {
		params.what = source.what;
		params.when = source.when;
		params.where = source.where;
	}

	params.user = request.session.username;
	params.ignoreWhereWhen = coalesce;
	params.minScore = scores.minimum;
	params.maxScore = scores.maximum;
	params.connectionNumber = numConnections || 2;
	params.onlyMyMaps = userOnly;

	var onSvgLoaded = function (obj) {
		var html = obj.svg.html;
		html = html.split('</svg>')[0].concat('<script xlink:href="/js/SVGPan.js"></script></svg>');
		var rendered = new Buffer(html);
		response.send(rendered);
	};

	var onExperimentGroupLoaded = function(obj){

		var loadedArticle = obj.article;
		for (var i=loadedArticle.experimentGroups.length-1; i>=0; i--) {
			var group = loadedArticle.experimentGroups[i];
			var score = group.calculateScore();
			if (score < params.minScore || score > params.maxScore) {
				loadedArticle.experimentGroups.splice(i, 1);
			}
		}
		var isGlobal = true;
		var dot = loadedArticle.toDot(isGlobal);
		var svg = new Svg();
		svg.loaded(onSvgLoaded);
		svg.loadDot(dot);
	};

	var article = new Article();
	article.loadGlobally(params, onExperimentGroupLoaded);

	//experimentGroup.search(onExperimentGroupLoaded);
	//neurolax.model.search(request.session.username,source,destination,scores,numConnections,mode,coalesce,relabelMap,function(err,rendered){
	//	if(err)
	//		console.log("Error " + err);
	//	else if(rendered === null)
	//		response.send("No match found");
	//	else{
	//		rendered = rendered.toString().split('</svg>')[0].concat('<script xlink:href="/js/SVGPan.js"></script></svg>');
	//		rendered = new Buffer(rendered);
	//		console.log("coalesce is " + coalesce);
	//		response.send(rendered);
	//	}
	//}, userOnly);
}

NeurolaxTerm.prototype.autocomplete = function(request,response){
	neurolax.model.autocomplete(request.query.term,function(res){
		res.pipe(response);
	});
}

module.exports.controller = new NeurolaxTerm();