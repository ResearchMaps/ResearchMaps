var Maps = require('./maps.js');

//---------------------------------------------------------------------------------
//---------------------------------------------------------------------------------
//---------------------------------------------------------------------------------
//---------------------------------------------------------------------------------
//---------------------------------------------------------------------------------
//  Event
//

function Event(){
    var self = this;
    this.register = function (handler, single) { return self._register(self, handler, single); };
    this.fire = function (event) { self._fire(self, event); };
    this.Handlers = [];
}

//--- register ------------------------------------------------------------------------------
Event.prototype._register = function (self, handler, single) {

    if (!Maps.has(handler)) { return; }

    single = single || false;

    var returnMutator = {};
    returnMutator.append = function(append) { self._append = append;  };
    var handlerObj = {};
    handlerObj.handler = handler;
    handlerObj.single = single;
    self.Handlers.push(handlerObj);
    return returnMutator;
};

//--- fire ------------------------------------------------------------------------------
Event.prototype._fire = function (self, event) {

    var append = self._append || {};

    for(var name in append) {
        event[name] = append[name];
    }

    for (var i = self.Handlers.length-1; i >= 0; i--) {
        var handlerObj = self.Handlers[i];
        handlerObj.handler(event, this, arguments.callee.caller);
        if (handlerObj.single) {
            self.Handlers.splice(i, 1);
        }
    }
};

//---------------------------------------------------------------------------------
//---------------------------------------------------------------------------------

module.exports = Event;