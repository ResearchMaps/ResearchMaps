var Event = require('../utility/event.js');
var Maps = require('../utility/maps.js');
var Experiment = require('./experiment.js');
var DB = require('./DBobject.js');
var graphDB = DB.graphDB;
var ExperimentGroup = require('./experimentGroup.js');

//---------------------------------------------------------------------------------
//---------------------------------------------------------------------------------
//---------------------------------------------------------------------------------
//---------------------------------------------------------------------------------
//---------------------------------------------------------------------------------
//  Article
//
function Article(id){

    var self = this;


    this.load = function(uname, uuid) { self._load(self, uname, uuid); };
    this.onLoadArticle = function(error, results) { self._onLoadArticle(self, error, results); };
    this.onLoadExperiments = function(error, results) { self._onLoadExperiments(self, error, results); };
    this.onLoadHypotheticalExperiments = function(error, results) { self._onLoadHypotheticalExperiments(self, error, results); };
    this.toDot = function(isGlobal) { return self._toDot(self, isGlobal); };
    this.getExperiments = function() { return self._getExperiments(self);  };
    this.makePrivate = function() { self._makePrivate(self, false);};
    this.makePublic = function() { self._makePrivate(self, true);};
    this.delete = function(callback) { self._delete(self, callback); };
    this.loadGlobally = function(params, callback) { self._loadGlobally(self, params, callback); };

    var loaded = new Event();
    
    var revert = new Event();

    var madePrivate = new Event();

    var crud = new Event();

    this.crud = crud.register;
    this._crud = crud;
    this.revert = revert.register;
    this._madePrivate = madePrivate;
    this.madePrivate = madePrivate.register;
    this._revert = revert;
    this.loaded = loaded.register;
    this._loaded = loaded;
    this.id = id;
};

//--- delete ------------------------------------------------------------------------------
Article.prototype._delete = function (self, callback) {

    var deleted = 0;

    self.crud(callback, true);

    var deleteArticle = function() {

        var params = {};
        params.uuid = self.id;

        var query = " Match (p:Paper)-[r]-() \n";
        query += " WHERE p.uuid={uuid} \n";
        query += " DELETE p,r \n";

        graphDB.instance.query(query, params, function() { self._crud.fire(); });
    };

    var experimentGroupDeleted = function(g) {
        deleted++;
        if (deleted == self.experimentGroups.length) { deleteArticle(); }
    };

    if (Maps.has(self.experimentGroups)) {
        for (var i=0; i<self.experimentGroups.length; i++){
            self.experimentGroups[i].delete(experimentGroupDeleted);
        }
    }
    else {
        deleteArticle();
    }

};

//--- makePrivate ------------------------------------------------------------------------------
Article.prototype._makePrivate = function (self, public) {

    var params = {};
    params.uuid = self.id;

    var query= "Match (p:Paper) \n";
    query +=  " WHERE p.uuid={uuid} \n";
    query +=  " SET p.public=" + public.toString().toLowerCase() + " ";

    graphDB.instance.query(query, params, function(){ self._madePrivate.fire(); });
};

//--- getExperiments ------------------------------------------------------------------------------
Article.prototype._getExperiments = function (self) {
    var experiments = [];
    for (var i=0; i<self.experimentGroups.length; i++){
        var group = self.experimentGroups[i];
        for (var j=0; j<group.experiments.length; j++){
            var experiment = group.experiments[j];
            experiments.push(experiment);
        }
    }
    return experiments;
};

//--- toDot ------------------------------------------------------------------------------
Article.prototype._toDot = function (self, isGlobal) {

    if (typeof isGlobal === 'undefined') { isGlobal = false; }
    var dot = 'digraph G { \n';
    dot +=    '     graph [ rankdir = LR, id = "viewport" ]; \n';
    
    for(var i=0; i<self.experimentGroups.length; i++){
        var experiment = self.experimentGroups[i];
        dot +=    '     ' + experiment.agentLabel()  +  ' [ labelloc = "b", id = "' + experiment.agentId() + '" ]; \n';
        dot +=    '     ' + experiment.targetLabel() +  ' [ labelloc = "b", id = "' + experiment.targetId() + '" ]; \n';
        dot +=    '     ' + experiment.getDotEdge(isGlobal) + ' \n';
    }
    
    dot +=    '}';

    return dot;
};

//--- onLoadHypotheticalExperiments ------------------------------------------------------------------------------
Article.prototype._onLoadHypotheticalExperiments = function (self, error, results) {

    if (error != null){
        throw error;
    }

    var experimentGroups = self.experimentGroups;

    if (results.length > 0) {
        for (var i=0; i<results.length; i++){
            var experiment = new Experiment().fromNeo(results[i]);
            var key = experiment.agentLabel() + "|" + experiment.targetLabel();
            experimentGroups[key].addHypothetical(experiment);
        }
    }
    
    var experimentGroupsArr = [];

    for(var key in experimentGroups){
        if (experimentGroups.hasOwnProperty(key)){
            experimentGroupsArr.push(experimentGroups[key]);
        }
    }

    self.experimentGroups = experimentGroupsArr;

    var event = {};
    event.article = self;
    self._loaded.fire(event);
};

//--- onLoadExperiments ------------------------------------------------------------------------------
Article.prototype._onLoadExperiments = function (self, error, results) {

    if (error != null){
        throw error;
    }

    var experimentGroups = {};

    for (var i=0; i<results.length; i++){
        var experiment = new Experiment().fromNeo(results[i]);
        var key = experiment.agentLabel() + "|" + experiment.targetLabel();
        
        // || magic = take first if not undefined else take second
        var experimentGroup = experimentGroups[key] || new ExperimentGroup();
        experimentGroup.add(experiment);
        experimentGroups[key] = experimentGroup;
    }

    self.experimentGroups = experimentGroups;

    var params = self._params;

    var query = " match (p:Paper)-[:consistsOf]-(a:Experiment)-[:agent]-(m:NeurolaxTerm)-[r]->(n:NeurolaxTerm)<-[:target]-(a:Experiment) \n";
    query +=   "  where p.uuid={uuid} \n";
    query +=   "  return m,n,r,a,p;";
    
    console.log(query);

    //graphDB.instance.query(query, params, self.onLoadHypotheticalExperiments);

    self._onLoadHypotheticalExperiments(self, null, []);
};

//--- loadGlobally ------------------------------------------------------------------------------
Article.prototype._loadGlobally = function (self, params, callback) {

    if (Maps.has(callback)) { self.loaded(callback); }

    if (Maps.hasStr(params.what)) { params.what = "(?i)" + params.what; }

    var wwwString = "{0}.What=~{{0}what} \n";
    if (Maps.hasString(params.when)) { params.when = "(?i)" + params.when;  wwwString += " AND {0}.When=~{{0}when}"; }
    if (Maps.hasString(params.where)) { params.where = "(?i)" + params.where;  wwwString += " AND {0}.Where=~{{0}where}"; }
    if (Maps.hasString(params.when) || Maps.hasString(params.where)) { wwwString = Maps.format("({0}) \n", wwwString.trim()); }

    params.mwhat = Maps.hasStr(params.what) ? params.what : params.agentWhat;
    params.mwhen = Maps.hasStr(params.when) ? params.when : params.agentWhen;
    params.mwhere = Maps.hasStr(params.where) ? params.where : params.agentWhere;

    params.nwhat = Maps.hasStr(params.what) ? params.what : params.targetWhat;
    params.nwhen = Maps.hasStr(params.when) ? params.when : params.targetWhen;
    params.nwhere = Maps.hasStr(params.where) ? params.where : params.targetWhere;

    var ownerString = params.onlyMyMaps ?  "where u.username={user} \n" : "where y.public=true OR u.username={user} \n";

    var query = "Match (u:User)-[:adds]->(y:Paper)-[:consistsOf]->(e:Experiment)-[:agent]->(m:NeurolaxTerm) \n";
    query += ownerString;
    query += "With m\n";
    query += Maps.format("MATCH p=(m)-[r:gives*1..{0}]->(n:NeurolaxTerm) \n", params.connectionNumber);
    query += "WHERE " + Maps.format(wwwString, "m");
    if (params.mwhat === params.nwhat) {
        query += "OR " +  Maps.format(wwwString, "n");  // Searching for single entity
    }
    else {
        query += "AND " +  Maps.format(wwwString, "n"); // Searching for Agent–Target pair
    }
    query += "WITH DISTINCT(EXTRACT(i IN NODES(p)| ID(i))) AS ids \n";
    query += "MATCH (n1:NeurolaxTerm),(n2:NeurolaxTerm) \n";
    query += "WHERE id(n1) in ids AND id(n2) in ids AND id(n2) <> id(n1) \n";
    query += "MATCH (a:Experiment)-[:agent]->n1-[:gives]->n2<-[:target]-(a:Experiment) \n";
    query += "RETURN n1 as m, n2 as n, a";

    console.log(query);

    var wrapper = function(error, results) {
        if (!params.ignoreWhereWhen) {self.onLoadExperiments(error, results); return; }
        var agentToTargetHash = {};
        for(var i=0; i<results.length; i++){
            var row = results[i];
            row.m._data.data.When = "";
            row.m._data.data.Where = "";
            row.n._data.data.When = "";
            row.n._data.data.Where = "";
        }
        self.onLoadExperiments(error, results);
    };

    graphDB.instance.query(query, params, wrapper);
};

//--- loadExperiments ------------------------------------------------------------------------------
Article.prototype._loadExperiments = function (self) {

    var params = self._params;

    var query = "match (p:Paper)-[:consistsOf]-(a:Experiment)-[:agent]-(m:NeurolaxTerm)-[r]->(n:NeurolaxTerm)<-[:target]-(a:Experiment) \n";
    query +=   " where p.uuid={uuid} \n";
    query +=   " return m,n,r,a,p;";

    console.log(query);

    graphDB.instance.query(query, params, self.onLoadExperiments);
};

//--- onLoadArticle ------------------------------------------------------------------------------
Article.prototype._onLoadArticle = function (self, error, results) {

    if (error != null){
        throw error;
    }

    var data = results[0].p._data.data;
    var owner = results[0].u._data.data.username;
    var username = self._params.username;
    var isOwner = false;
    if(owner === username){
        isOwner = true;
    }

    self.title = data.title;
    self.authors = data.authors;
    self.journal = data.journal;
    self.uuid = data.uuid;
    self.isOwner = isOwner;
    self._loadExperiments(self);

};

//--- loadNew ------------------------------------------------------------------------------
Article.prototype._loadNew = function (self, callback) {

    var articleLoaded = function(error, results) {
        self._crud.fire(self);
    };

    var articleExperimentLoaded = function(error, results){

        if (results.length == 0) {

            var params = {};
            params.uuid = self.id;

            var query = " Match (p:Paper) \n";
            query +=    " WHERE p.uuid={uuid} \n";
            query +=    " Return p, id(p) \n";

            graphDB.instance.query(query, params, articleLoaded);
        }
        else {
            console.log("here");
        }
    };

    self.crud(callback, true);

    var params = {};
    params.uuid = self.id;

    var query = " Match (p:Paper)-[:consistsOf]-b \n";
    query +=    " WHERE p.uuid={uuid} \n";
    query +=    " Return p, id(p), b, id(b) \n";

    graphDB.instance.query(query, params, articleExperimentLoaded);
};

//--- load ------------------------------------------------------------------------------
Article.prototype._load = function (self, uname, uuid) {

    if (!Maps.has(uuid)) {
        self._loadNew(self, uname);
        return;
    }

    var start = new Date();
    var params = {};
    params.uuid = uuid;
    params.username = uname;

    self._params = params;

    var query = " Match (u:User)-[:adds]->(p:Paper) \n";
    query +=    " where (u.username={username}) AND p.uuid={uuid} AND p.public=false \n";
    query +=    " Return u,p \n";
    query +=    " UNION \n";
    query +=    " MATCH (u:User)-[:adds]->(p:Paper) \n";
    query +=    " WHERE p.public=true and p.uuid={uuid} \n";
    query +=    " Return u,p \n";

    graphDB.instance.query(query, params, self.onLoadArticle);
};

//---------------------------------------------------------------------------------
//---------------------------------------------------------------------------------

module.exports = Article;