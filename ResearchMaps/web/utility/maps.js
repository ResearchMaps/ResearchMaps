//---------------------------------------------------------------------------------
//---------------------------------------------------------------------------------
//---------------------------------------------------------------------------------
//---------------------------------------------------------------------------------
//---------------------------------------------------------------------------------
//  Maps
//

function Maps(){}

//----- array -----------------------------------------------------------------
Maps.array = function (obj) {

    if(!(Object.prototype.toString.call(obj) === '[object Array]')) {
        return [obj];
    }

    return obj;
};

//----- has -----------------------------------------------------------------
Maps.has = function (properties) {

    if(!(Object.prototype.toString.call(properties) === '[object Array]')) {
        return typeof  properties != "undefined";
    }

    for (var i=0; i<properties.length; i++){
        if (typeof properties[i] == "undefined"){
            return false;
        }
    }

    return true;
};

//----- hasString -----------------------------------------------------------------
Maps.hasString = function (str) {
    return Maps.has(str) && !Maps.nullOrWhite(str);
};

//----- hasStr -----------------------------------------------------------------
Maps.hasStr = function (str) {
    return Maps.hasString(str);
};


//----- nullOrWhite -----------------------------------------------------------------
Maps.nullOrWhite = function (str) {

    if (!Maps.has(str)) { return true; }

    return (str === null || str.match(/^ *$/) !== null);
};

//----- format -----------------------------------------------------------------
Maps.format = function () {
    var args = arguments;
    return args[0].replace(/{(\d+)}/g, function(match, number) {
        var idx = parseInt(number);
        return typeof args[idx+1] != 'undefined'  ? args[idx+1] : match;
    });
};



//---------------------------------------------------------------------------------
//---------------------------------------------------------------------------------

module.exports = Maps;