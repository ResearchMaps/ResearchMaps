var Event = require('../utility/event.js');
var graphviz = require('graphviz');
var fs = require('fs');
//---------------------------------------------------------------------------------
//---------------------------------------------------------------------------------
//---------------------------------------------------------------------------------
//---------------------------------------------------------------------------------
//---------------------------------------------------------------------------------
//  Svg
//
function Svg(){

    var self = this;

    this.loadDot = function(dot) { self._loadDot(self, dot); };
    this.onLoaded = function(html) { self._onLoaded(self, html); };
    this.toBuffer = function() { return new Buffer(self.html); };

    var loaded = new Event();

    this.loaded = loaded.register;
    this._loaded = loaded;
};

//--- onLoaded ------------------------------------------------------------------------------
Svg.prototype._onLoaded = function (self, html) {

    self.html = html == null ? "" : html.toString().split('</svg>')[0].concat('<script xlink:href="/js/SVGPan.js"></script></svg>');

    var event = {};
    event.svg = self;
    self._loaded.fire(event);
};

//--- fromDot ------------------------------------------------------------------------------
Svg.prototype._loadDot = function (self, dot) {
    var g = graphviz.digraph("G");
    g.outputStr(dot, self.onLoaded);
};

//---------------------------------------------------------------------------------
//---------------------------------------------------------------------------------

module.exports = Svg;