var graphDB = require("../models/graphDB.js").graphDB
, async = require('async')
, types = require('./Types.json')
, crypto = require('crypto');

function AuthSystem(){

}

AuthSystem.prototype.authorize = function(request,response,next){
	if(request.session.username){
		next();
	}
	else{
		response.redirect('/login'); 
	}
}

AuthSystem.prototype.authorizeEditor = function(request,response,next){
        if(request.session.username && request.session.editorStatus == true){
                next();
        }
        else{
                response.redirect('/login');
        }
};

AuthSystem.prototype.authenticate = function(request,response,next){
	var input =  {
		username : request.body.username
	};
	graphDB.findNode(types.node.USER,input,function(err,result){
		if(err || result.length === 0)
			response.json("Invalid username or password");
		else{
			console.log(JSON.stringify(result));
			var user = result[0]["node"]["_data"]["data"];
			console.log(user);
			crypto.pbkdf2( request.body.password, user.salt, 10000, 512, function( err, derivedKey ){
				if(derivedKey.toString('hex') === user.hash){
					request.session.username = request.body.username;
					request.session.userID = user["uuid"];
					request.session.editorStatus = user["editorStatus"];
					response.redirect('/map');
				}
				else
					response.json("Invalid username or password");
			});

		}
	},true);
};

AuthSystem.prototype.addNewUser = function(request,response){

};

AuthSystem.prototype.logout = function(request,response){
	if(request.session.username) {
		request.session.username = null;
		request.session.editorStatus = null;
	}

	response.redirect('/login');
}

module.exports = new AuthSystem();
