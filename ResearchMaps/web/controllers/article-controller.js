var paper = require('../models/paper.js');
var async = require('async');
var types = require('./Types.json');
var http = require('http');
var xml2json = require('xml2js');
var dust = require('dustjs-linkedin');
var graphExperiment = require('./graphExperiment.js');
var Article = require('../models/article.js');
var Experiment = require('../models/experiment.js');
var Entity = require('../models/entity.js');
var experiment = require('../models/graphExperiment.js');
var request = require('request');
var Maps = require('../utility/maps.js');

//---------------------------------------------------------------------------------
//---------------------------------------------------------------------------------
//---------------------------------------------------------------------------------
//---------------------------------------------------------------------------------
//---------------------------------------------------------------------------------
//  ArticleController
//
function ArticleController(){
    var self = this;

    this.private = function(req,res) { self._private(self, req, res); };
    this.update = function(req,res) { self._update(self, req, res); };
    this.delete = function(req,res) { self._delete(self, req, res); };
    this.pubSearch = function(req, res) { self._pubSearch(self, req, res); };
}

//--- pubSearch ------------------------------------------------------------------------------
ArticleController.prototype._pubSearch = function (self, req, res) {
    var first = req.query.first;
    var second = req.query.second;
    //http://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=apple&retmax=2
    var url = 'http://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=' + encodeURIComponent(first) + encodeURIComponent(" ") + encodeURIComponent(second) + '&retmax=10&retmode=json';
    //var url = 'http://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=apple&retmax=10&retmode=json';
    request(url, function (error, response, body) {
        var obj = null;
        try { obj = JSON.parse(body); } catch(err) { res.json([]); }
        if (obj.esearchresult.count == 0) {
            res.json([]);
            return;
        }
        var ids = obj.esearchresult.idlist.join(",");
        var url = 'http://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=' + ids + '&retmode=json';
        request(url, function (error, response, body) {
            var obj = JSON.parse(body);
            var results = [];

            for (var cur in obj.result) {
                var title = obj.result[cur].title;
                var robj = {};
                robj.title = title;
                robj.pmcrefcount = obj.result[cur].pmcrefcount;
                if (Maps.has(title)) { results.push(robj); }
            }

            var sorted = results.sort(function(a,b) {
                return (b.pmcrefcount || 0) - (a.pmcrefcount || 0);
            });

            var sorted_results = [];
            for (var i=0; i<sorted.length; i++) {
                sorted_results.push(sorted[i].title);
            }

            res.json(sorted_results);
        });
    });
};

//--- delete ------------------------------------------------------------------------------
ArticleController.prototype._delete = function (self, req, res) {

    var articleDeleted = function(){
        res.json("success");
    };

    var articleLoaded = function(a){
        a.delete(articleDeleted);
    };

    var id = req.query.id;

    var article = new Article(id);
    article.load(articleLoaded);
};

//--- update ------------------------------------------------------------------------------
ArticleController.prototype._update = function (self, req, res) {

    var found = JSON.parse(req.query.found);

    var what = req.query.what;
    var where = req.query.where;
    var when = req.query.when;
    var prev = req.query.prev;

    var iter = function(i) {
        var cur = found[i];
        var exp = cur.attributes;

        if (exp.WhatAgent == prev.what && exp.WhereAgent == prev.where && exp.WhenAgent == prev.when){
            exp.WhatAgent = what;
            exp.WhereAgent = where;
            exp.WhenAgent = when;
        }

        if (exp.WhatTarget == prev.what && exp.WhereTarget == prev.where && exp.WhenTarget == prev.when){
            exp.WhatTarget = what;
            exp.WhereTarget = where;
            exp.WhenTarget = when;
        }

        var paper = req.query.paper;
        req.body.experiment = exp;
        req.body.paper = paper;
        if (i == found.length-1) {
            graphExperiment.controller.editMultipleExperiment(req, res);
        }
        else {
            graphExperiment.controller.editMultipleExperiment(req, res, function() { iter(i+1); });
        }
    };

    iter(0);

    return;

    var id = req.query.id;
    var isAgent = req.query.isAgent == "true";
    var what = req.query.what;
    var where = req.query.where;
    var when = req.query.when;
    var prev = req.query.prev;

    var agent = { "What":null };
    agent["Where"]="";
    agent["When"]="";

    var target = { "What":null };
    target["Where"]="";
    target["When"]="";

    var paper = { "uuid":null };

    var experimentData =
    {
        Agent:null,
        AgentApproach:null,
        Manipulation:null,
        Target:null,
        TargetApproach:null,
        Result:null
    };

    var experimentEdited = function(err, results){
        if(err) { res.json(err); } else { res.json("Success"); }
    };

    var experimentLoaded = function(e) {

        experimentData.Agent = isAgent ? what : e.agent.what;
        experimentData.AgentApproach = e.agentApproach;
        experimentData.Manipulation = e.manipulation;
        experimentData.Target = isAgent ? e.target.what : what;
        experimentData.TargetApproach = e.targetApproach;
        experimentData.Result = e.result;

        agent.What = isAgent ? what : e.agent.what;
        agent.Where = isAgent ? where : e.agent.where;
        agent.When = isAgent ? when : e.agent.when;

        target.What = !isAgent ? what : e.target.what;
        target.Where = !isAgent ? where : e.target.where;
        target.When = !isAgent ? when : e.target.when;

        paper.uuid = e.paperId;

        experiment.model.editExperiment(id, req.session.username,
            paper, experimentData, agent, target, experimentEdited);
    };

    var experimentObj = new Experiment(id);
    experimentObj.load(experimentLoaded);
};

//--- private ------------------------------------------------------------------------------
ArticleController.prototype._private = function (self, req, res) {

    var id = req.query.id;

    var article = new Article(id);
    article.madePrivate(function() { res.json("success"); });
    article.makePrivate();
};

//---------------------------------------------------------------------------------
//---------------------------------------------------------------------------------

module.exports = new ArticleController();
