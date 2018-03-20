var graphDB = require('../models/graphDB.js').graphDB
, types = require('./Types.json')
, mailer = require('./email.js')()
, sender = require('../config/mailConfig.json')
, userModel = require('../models/User.js').model
, dust = require('dustjs-linkedin')
, crypto = require('crypto')
, async = require('async');

function User(){}
User.prototype.forgotPassword = function(request,response){
	var user = {
		"username":request.query.username
	};
	userModel.forgotPassword(user,function(err,result){
		if(err)
			response.json(err);
		else if(result.length === 0)
			response.json("No user found");
		else{
			var userData = result[0]["node"]["_data"]["data"];
			var mailContents = {
				"source":sender["email"],
				"sourcePass":sender["password"],
				"sourceService":sender["service"],
				"destination":user["username"],
				"subject":"Reset your ResearchMaps password",
				"content":"Hi " + userData["firstName"] + " " + userData["lastName"] + ",\n\n" +
							"Here's your password reset link:" + 
							"\n\n" + request.protocol + "://" + request.get('host') + "/update/" + userData["uuid"] + "?token=1" +
							"\n\nThis link will be active for the next 24 hours. " +
							"Please reset your password before then." +
							"\n\nSincerely," +
							"\n\nResearchMaps Team"
			};
			mailer.send(mailContents);
			response.json("Sent recovery link to your email address");
		}
	});
};

User.prototype.checkPassword = function(request,response){
    var input =  {
        username : request.query.username
    };
    graphDB.findNode(types.node.USER,input,function(err,result){
        if(err || result.length === 0)
            response.json("Invalid username or password");
        else{
            console.log(JSON.stringify(result));
            var user = result[0]["node"]["_data"]["data"];
            console.log(user);
            crypto.pbkdf2( request.query.password, user.salt, 10000, 512, function( err, derivedKey ){
                if(derivedKey.toString('hex') === user.hash){
                    request.session.username = request.query.username;
                    request.session.userID = user["uuid"];
                    request.session.editorStatus = user["editorStatus"];
                    response.json("worked");
                }
                else
                    response.json("Invalid username or password");
            });

        }
    },true);
};

User.prototype.confirmAndUpdatePassword = function(request,response){
	var uuid = request.session.userID;
	var oldPassword = request.body.oldPassword;
	var newPassword = request.body.newPassword;
	userModel.confirmAndUpdatePassword(uuid,oldPassword,newPassword,function(err,result){
		if(err)
			response.json(err);
		else
			response.json("Successfully updated password");
	});
}

User.prototype.updatePassword = function(request,response){
	var uuid = request.params.uuid;
	var token = request.query.token;
	var password = request.body.password;
	userModel.updatePassword(uuid,token,password,function(err,result){
		if(err)
			response.json(err);
		else
			response.json("Successfully updated password");
	});
};

User.prototype.fetchUpdateHTML = function(request,response){
	dust.render('updatePassword',{"uuid":request.params.uuid,"_csrf":null},function(err,html){
		response.send(html);
	});
};

User.prototype.editUser = function(){

	var query = [
		"MATCH (u:User)",
		"RETURN u"
	].join("\n");

	graphDB.instance.query(query,null,function(err,results){
		if(err)
			console.log(err);
		else{
			async.eachSeries(results,function(result,callback){
				var userData = result["u"]["_data"]["data"];
				console.log(JSON.stringify(userData));
				if(userData["username"] === "emailaddress@domain.com")
					return callback();
				try{
					var salt = crypto.randomBytes(128).toString('hex');
				}
				catch(err){
					callback(err,null);
					return;
				}
				crypto.pbkdf2( userData.password, salt, 10000, 512, function( err, derivedKey ){
					var query = [
						"MATCH (u:User)",
						"WHERE u.username={username}",
						"SET u.hash={hash}",
						"SET u.salt={salt}",
						"REMOVE u.password",
						"RETURN u"
					].join("\n");
					var params = {
						"username":userData.username,
						"hash":derivedKey.toString('hex'),
						"salt":salt
					};
					graphDB.instance.query(query,params,function(err,result){
						if(err)
							console.log(err);
						callback(err,result);
					});
				},
				function(err){
					console.log(err);
				});
			});
		}
	});
}

module.exports.controller = new User();
