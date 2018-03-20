var Email = require('../utility/email.js');

module.exports = function(){
    var email = function(input){
        var options = {};
        options.to = input.destination;
        options.subject =  input.subject;
        options.message = input.content;
        new Email().send(options);
    };
    return{
        send:email
    };
};