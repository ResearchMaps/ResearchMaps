var emailjs = require('emailjs');
var Maps = require('./maps.js');

//---------------------------------------------------------------------------------
//---------------------------------------------------------------------------------
//---------------------------------------------------------------------------------
//---------------------------------------------------------------------------------
//---------------------------------------------------------------------------------
//  Email
//

function Email(){
    var self = this;
    this.send = function (options, callback) { return self._send(self, options, callback); };
}

//--- send ------------------------------------------------------------------------------
Email.prototype._send = function (self, options, callback) {

    var callbackFun = callback || function (err, msg) { if (Maps.has(err) && err != null) { console.log(err);  } };

    var serverOptions = {};
    serverOptions.user = "emailaddress@domain.com";
    serverOptions.password = "emailpassword";
    serverOptions.host = "smtp.domain.com";
    serverOptions.ssl = true;

    var server = emailjs.server.connect(serverOptions);

    var sendOptions = {};
    sendOptions.text = options.message;
    sendOptions.from = "emailaddress@domain.com";
    sendOptions.to = options.to;
    sendOptions.subject = options.subject;

    server.send(sendOptions, callbackFun);
};

//---------------------------------------------------------------------------------
//---------------------------------------------------------------------------------

module.exports = Email;