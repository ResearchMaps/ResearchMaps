var Event = require('../utility/event.js');
var Maps = require('../utility/maps.js');
var Entity = require('./entity.js');
var DB = require('./DBobject.js');
var graphDB = DB.graphDB;

//---------------------------------------------------------------------------------
//---------------------------------------------------------------------------------
//---------------------------------------------------------------------------------
//---------------------------------------------------------------------------------
//---------------------------------------------------------------------------------
//  Experiment
//
function Experiment(id){

    var self = this;

    this.fromNeo = function(row) { return self._fromNeo(self, row); };
    this.agentLabel = function() { return self._agentLabel(self); };
    this.targetLabel = function() { return self._targetLabel(self); };
    this.agentId = function() { return self._agentId(self); };
    this.targetId = function() { return self._targetId(self); };
    this.agents = function(agents) { return self._agents(self, agents); };
    this.target = function(target) { return self._target(self, target); };
    this.replaceTarget = function(oldTarget, newTarget, callback) { return self._replaceTarget(self, oldTarget, newTarget, callback); };
    this.replaceAgent = function(oldAgent, newAgent, callback) { return self._replaceAgent(self, oldAgent, newAgent, callback); };
    this.save = function(callback) { self._save(self, callback); };
    this.onSave = function() { self._crud.fire(self); };
    this.delete = function(callback) { self._delete(self, callback); };
    this.load = function(callback) { self._load(self, callback); };

    var crud = new Event();

    this.crud = crud.register;
    this._crud = crud;

    this._agentsArr = [];
    this.isMediation = false;
    this.isHypothetical = false;
    this.id = id;

};

//--- load ------------------------------------------------------------------------------
Experiment.prototype._load = function (self, callback) {

    self.crud(callback);

    var query = " MATCH (p)-[:consistsOf]->(n:Experiment)-[e]->(t) \n";
    query +=    " WHERE n.uuid = {uuid} AND (type(e)='agent' OR type(e)='target') \n";
    query +=    " RETURN n, t, p, type(e) AS edgeType, id(n) AS dbid";

    var experimentLoaded = function(err, rows) {
        console.log(rows);
        var dbid = rows[0].dbid;
        var data = rows[0].n._data.data;
        self.agent = data.Agent;
        self.agentApproach = data.AgentApproach;
        self.manipulation = data.Manipulation;
        self.result = data.Result;
        self.target = data.Target;
        self.targetApproach = data.TargetApproach;
        self.conclusion = data.conclusion;
        self.uuid = data.uuid;
        self.paperId = rows[0].p._data.data.uuid;
        self.StatTest = data.StatTest;
        self.pvalue = data.pvalue;
        self.foldChange = data.foldChange;

        var agentData = rows[0].edgeType == "agent" ? rows[0].t._data.data : rows[1].t._data.data;
        var targetData = rows[0].edgeType == "agent" ? rows[1].t._data.data : rows[0].t._data.data;

        self.agent = new Entity(true).fromNeo(agentData);
        self.target = new Entity(false).fromNeo(targetData);

        self._crud.fire(self);
    };

    var params = {};
    params.uuid = self.id;

    graphDB.instance.query(query, params, experimentLoaded);
};

//--- replaceAgent ------------------------------------------------------------------------------
Experiment.prototype._replaceAgent = function (self, oldAgent, newAgent, callback) {

    var onEntityCreate = function(entity) {

        var params = {};
        params.uuid = self.id;
        params.id = entity.id;

        var query = " MATCH (n:NeurolaxTerm),(e:Experiment) \n";
        query +=    " WHERE e.uuid={uuid} AND id(n)={id} \n";
        query +=    " CREATE (e)-[:agent]->(n) RETURN n, e";

        graphDB.instance.query(query, params, function(err, rows) {
            var hold = entity;
            console.log(rows);
            self._crud.fire();
        });
    };

    var onDeleteOld = function() {
        newAgent.save(onEntityCreate);
    };

    self.crud(callback, true);

    var params = {};
    params.uuid = self.id;

    var query = " MATCH (n:NeurolaxTerm)<-[a:agent]-(e:Experiment) ";
    query +=    " WHERE e.uuid={uuid} ";
    if (Maps.has(oldAgent.what)) { query += " AND n.What={what} "; params.what = oldAgent.what; }
    if (Maps.has(oldAgent.where)) { query += " AND n.Where={where} "; params.where = oldAgent.where; }
    if (Maps.has(oldAgent.when)) { query += " AND n.When={when} "; params.when = oldAgent.when; }
    query +=    " DELETE a ";

    graphDB.instance.query(query, params, onDeleteOld);

};

//--- replaceTarget ------------------------------------------------------------------------------
Experiment.prototype._replaceTarget = function (self, oldTarget, newTarget, callback) {

    var onEntityCreate = function(entity) {

        var params = {};
        params.uuid = self.id;
        params.id = entity.id;

        var query = " MATCH (n:NeurolaxTerm),(e:Experiment) ";
        query +=    " WHERE e.uuid={uuid} AND id(n)={id} ";
        query +=    " CREATE (e)-[:target]->(n) ";

        graphDB.instance.query(query, params, function() { self._crud.fire(); });
    };

    var onDeleteOld = function() {
        newTarget.save(onEntityCreate);
    };

    self.crud(callback, true);

    var params = {};
    params.uuid = self.id;

    var query = " MATCH (n:NeurolaxTerm)<-[t:target]-(e:Experiment) ";
    query +=    " WHERE e.uuid={uuid} ";
    if (Maps.has(oldTarget.what)) { query += " AND n.What={what} "; params.what = oldTarget.what; }
    if (Maps.has(oldTarget.where)) { query += " AND n.Where={where} "; params.where = oldTarget.where; }
    if (Maps.has(oldTarget.when)) { query += " AND n.When={when} "; params.when = oldTarget.when; }
    query +=    " DELETE t ";

    graphDB.instance.query(query, params, onDeleteOld);

};

//--- delete ------------------------------------------------------------------------------
Experiment.prototype._delete = function (self, callback) {
    self.crud(callback, true);

    var deleted = 0;

    var deleteExperiment = function(){
        var params = {};
        params.uuid = self.id;

        var query = " Match (e:Experiment)-[r]-() \n";
        query += " WHERE e.uuid={uuid} \n";
        query += " DELETE e,r \n";

        graphDB.instance.query(query, params, function() { self._crud.fire(); });
    };

    var entityDeleted = function(){
        deleted++;
        if (deleted == self._agentsArr.length + 1){
            deleteExperiment();
        }
    };

    var onIncoming = function(e){
        if ((e.isAgent && e.incoming == 1) || (!e.isAgent && e.incoming == self._agentsArr.length + 1)) {
            e.delete(entityDeleted);
        }
        else {
            entityDeleted();
        }
    };

    if (self._agentsArr.length > 0){
        for (var i=0; i<self._agentsArr.length; i++){
            self._agentsArr[i].getIncoming(onIncoming);
        }
        self._targetObj.getIncoming(onIncoming);
    }
    else {
        deleteExperiment();
    }
};

//--- save ------------------------------------------------------------------------------
Experiment.prototype._save = function (self, callback) {
    self.crud(callback);

    var params = {};
    params.uuid = self.id;

    var query= "MATCH (e:Experiment)-[:target]->(t),(e:Experiment)-[:agent]->(a)\n";
    query +=  " WHERE e.uuid={uuid} \n";
    if (self._agentsArr.length > 0 && !Maps.nullOrWhite(self._agentsArr[0].what)) {
        query +=  " SET a.What='" + self._agentsArr[0].what + "' \n";
    }
    if (self._agentsArr.length > 0 && !Maps.nullOrWhite(self._agentsArr[0].where)) {
        query +=  " SET a.Where='" + self._agentsArr[0].where + "' \n";
    }
    if (self._agentsArr.length > 0 && !Maps.nullOrWhite(self._agentsArr[0].when)) {
        query +=  " SET a.When='" + self._agentsArr[0].when + "' \n";
    }
    if (Maps.has(self._targetObj) && !Maps.nullOrWhite(self._targetObj.what)) {
        query +=  " SET t.What='" + self._targetObj.what + "' \n";
    }
    if (Maps.has(self._targetObj) && !Maps.nullOrWhite(self._targetObj.where)) {
        query +=  " SET t.Where='" + self._targetObj.where + "' \n";
    }
    if (Maps.has(self._targetObj) && !Maps.nullOrWhite(self._targetObj.when)) {
        query +=  " SET t.When='" + self._targetObj.when + "' \n";
    }
    graphDB.instance.query(query, params, self.onSave);
};

//--- target ------------------------------------------------------------------------------
Experiment.prototype._target = function (self, target) {
    if (!Maps.has(target)){
        return self._targetObj;
    }

    self._targetObj = target;
};

//--- agents ------------------------------------------------------------------------------
Experiment.prototype._agents = function (self, agents) {
    if (!Maps.has(options)){
        return self._agentsArr;
    }

    for (var i=0; i<agents.length; i++){
        self._agentsArr.push(agents[i]);
    }
};

//--- targetId ------------------------------------------------------------------------------
Experiment.prototype._targetId = function (self) {
    return self.uuid + "_target";
};

//--- agentId ------------------------------------------------------------------------------
Experiment.prototype._agentId = function (self) {
    return self.uuid + "_agent";
};

//--- agentLabel ------------------------------------------------------------------------------
Experiment.prototype._agentLabel = function (self) {
    var whatAgent = self.WhatAgent || "";
    var whereAgent = self.WhereAgent || "";
    var whenAgent = self.WhenAgent || "";
    return '"' + (whatAgent + '\n' + whereAgent + '\n' + whenAgent) + '"';
};

//--- targetLabel ------------------------------------------------------------------------------
Experiment.prototype._targetLabel = function (self) {
    var whatTarget = self.WhatTarget || "";
    var whereTarget = self.WhereTarget || "";
    var whenTarget = self.WhenTarget || ""; 
    return '"' + (whatTarget + '\n' + whereTarget + '\n' + whenTarget) + '"';
};

//--- fromNeo ------------------------------------------------------------------------------
Experiment.prototype._fromNeo = function (self, row) {

    var rowExperiment = row.a._data.data;

    self.uuid = rowExperiment.uuid;

    if (typeof rowExperiment.StatisticalTest != "undefined"){
        self.StatTest = rowExperiment.StatisticalTest;
    }
    if (typeof rowExperiment.Pvalue != "undefined"){
        self.pvalue = rowExperiment.Pvalue;
    }
    if (typeof rowExperiment.FoldChange != "undefined"){
        self.foldChange = rowExperiment.FoldChange;
    }

    if (typeof rowExperiment.WhatSecondAgent != "undefined"){
        self.isMediation = true;
        self.WhatSecondAgent = rowExperiment.WhatSecondAgent;
        self.WhenSecondAgent = rowExperiment.WhenSecondAgent;
        self.SecondManipulation = rowExperiment.SecondManipulation;
        self.WhereSecondAgent = rowExperiment.WhereSecondAgent;
        self.SecondAgentApproach = rowExperiment.SecondAgentApproach;
    }

    self.conclusion = rowExperiment.conclusion;
    self.Result = rowExperiment.Result;
    self.Manipulation = rowExperiment.Manipulation;
    self.isHighlighted = rowExperiment.isHighlighted;

    self.Agent = rowExperiment.Agent;
    self.AgentApproach = rowExperiment.AgentApproach;
    self.Target = rowExperiment.Target;
    self.TargetApproach = rowExperiment.TargetApproach;
    
    self.WhatAgent = row.m._data.data.What;
    self.WhenAgent = row.m._data.data.When;
    self.WhereAgent = row.m._data.data.Where;
    self.WhatTarget = row.n._data.data.What;
    self.WhenTarget = row.n._data.data.When;
    self.WhereTarget = row.n._data.data.Where;

    if (self.AgentApproach === "HYPOTHETICAL" && self.TargetApproach === "HYPOTHETICAL"){
        self.isHypothetical = true;
    }

    return self;
};

//---------------------------------------------------------------------------------
//---------------------------------------------------------------------------------

module.exports = Experiment;