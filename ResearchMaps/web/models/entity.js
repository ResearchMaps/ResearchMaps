var Event = require('../utility/event.js');
var Maps = require('../utility/maps.js');
var DB = require('./DBobject.js');
var graphDB = DB.graphDB;

//---------------------------------------------------------------------------------
//---------------------------------------------------------------------------------
//---------------------------------------------------------------------------------
//---------------------------------------------------------------------------------
//---------------------------------------------------------------------------------
//  Entity
//
function Entity(isAgent){
    var self = this;

    this.delete = function(callback) { self._delete(self, callback); };
    this.getIncoming = function(callback) { self._getIncoming(self, callback); };
    this.experimentCount = function(callback) { self._experimentCount(self, callback); };
    this.save = function(callback) { self._save(self, callback); };
    this.fromNeo = function(row) { return self._fromNeo(self, row); };

    var crud = new Event();

    this.isAgent = isAgent;
    this.crud = crud.register;
    this._crud = crud;
};

//--- fromNeo ------------------------------------------------------------------------------
Entity.prototype._fromNeo = function (self, row) {
    self.what = row.What;
    self.when = row.When;
    self.where = row.Where;
    return self;
};

//--- save ------------------------------------------------------------------------------
Entity.prototype._save = function (self, callback) {

    var onEntityCreate = function(err, rows){
        self.id = rows[0].nid;
        self._crud.fire(self);
    };

    var onEntityLoad = function(err, rows){

        if (rows.length > 0) {
            self.id = rows[0].nid;
            self._crud.fire(self);
        }
        else {
            var params = {};
            params.props = {};
            if (Maps.has(self.what)) { params.props.what = self.what; }
            if (Maps.has(self.where)) { params.props.where = self.where; }
            if (Maps.has(self.when)) { params.props.when = self.when; }
            var query = " CREATE (n:NeurolaxTerm {props}) RETURN n, id(n) as nid";
            graphDB.instance.query(query, params, onEntityCreate);
        }
    };

    self.crud(callback, true);

    if (!Maps.has(self.id)) {

        var params = {};

        var query = " MATCH (n:NeurolaxTerm)";
        query +=    " WHERE 1=1 ";
        if (Maps.has(self.what)) { query += " AND n.What={what} "; params.what = self.what; }
        if (Maps.has(self.where)) { query += " AND n.Where={where} "; params.where = self.where; }
        if (Maps.has(self.when)) { query += " AND n.When={when} "; params.when = self.when; }
        query +=    " RETURN n, id(n) AS nid";
        graphDB.instance.query(query, params, onEntityLoad);
    }
};

//--- experimentCount ------------------------------------------------------------------------------
Entity.prototype._experimentCount = function (self, callback) {

    self.crud(callback, true);

    var params = {};

    var query = " MATCH (n:NeurolaxTerm)<-[e]-Experiment \n";
    query +=    " WHERE (type(e)='agent' OR type(e)='target') \n";
    if (Maps.has(self.what)) { query += " AND n.What={what} \n"; params.what = self.what; }
    if (Maps.has(self.where)) { query += " AND n.Where={where} \n"; params.where = self.where; }
    if (Maps.has(self.when)) { query += " AND n.When={when} \n"; params.when = self.when; }
    query +=    " RETURN count(e) AS cnt";

    graphDB.instance.query(query, params, function(err, rows) {
        var count = rows[0].cnt;
        self._crud.fire(count);
    });
};

//--- getIncoming ------------------------------------------------------------------------------
Entity.prototype._getIncoming = function (self, callback) {

    self.crud(callback, true);

    var params = {};
    params.id = self.id;

    if (self.isAgent) {
        var query = " MATCH (n)-[r]->() \n";
        query += " WHERE id(n) = {id} \n";
        query += " RETURN n, COUNT(DISTINCT n) \n";
    }
    else {
        var query = " MATCH (n)<-[r]-() \n";
        query += " WHERE id(n) = {id} \n";
        query += " RETURN n, COUNT(DISTINCT n) \n";
    }

    graphDB.instance.query(query, params, function() { self._crud.fire(); });
};

//--- delete ------------------------------------------------------------------------------
Entity.prototype._delete = function (self, callback) {

};

//--- targetId ------------------------------------------------------------------------------
//Experiment.prototype._targetId = function (self) {
//    return self.uuid + "_target";
//};

//---------------------------------------------------------------------------------
//---------------------------------------------------------------------------------

module.exports = Entity;