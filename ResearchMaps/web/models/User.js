var graphDB = require('./graphDB.js').graphDB
, async = require('async')
, types = require('./Types.json')
, crypto = require('crypto');

function User(){};

User.prototype.forgotPassword = function(user,controllerCallback) {
	graphDB.findNode(types.node.USER,user,function(err,result){
		if(err)
			console.log(err);
		controllerCallback(err,result);
	});
};
var updatePassword = function(user,password,callback){
	if(user.status === "Not approved"){
		callback("User not approved",null);
		return;
	}
	crypto.pbkdf2( password, user.salt, 10000, 512, function( err, derivedKey ){
		var query = [
			"MATCH (u:User)",
			"WHERE u.uuid={uuid}",
			"SET u.hash={hash}",
			"RETURN u"
		].join("\n");
		var params = {
			"uuid":user.uuid,
			"hash":derivedKey.toString('hex')
		};
		graphDB.instance.query(query,params,function(err,result){
			callback(err,result);
		});
	});
};
User.prototype.confirmAndUpdatePassword = function(userID,oldPassword,newPassword,controllerCallback){
	async.waterfall([
		function(callback){
			var params = {
				"uuid":userID
			};
			var query = [
				"MATCH (u:User)",
				"WHERE u.uuid={uuid}",
				"RETURN u"
			].join("\n");
			graphDB.instance.query(query,params,function(err,result){
				if(err)
					callback(err,null);
				else if(result.length === 0)
					callback("No user found",null);
				else{
					var user = result[0]["u"]["_data"]["data"];
					crypto.pbkdf2( oldPassword, user.salt, 10000, 512, function( err, derivedKey ){
						if(derivedKey.toString('hex') === user.hash){
							callback(null,user);
						}
						else
							callback("Incorrect password",null);
					});
				}
			});
		},
		function(user,callback){
			updatePassword(user,newPassword,callback);
		}
		],
		function(err,result){
			controllerCallback(err,result);
		}
	);
}
User.prototype.updatePassword = function(userID,token,password,controllerCallback){
	async.waterfall([
		function(callback){
			var params = {
				"uuid":userID
			};
			var query = [
				"MATCH (u:User)",
				"WHERE u.uuid={uuid}",
				"RETURN u"
			].join("\n");
			graphDB.instance.query(query,params,function(err,result){
				if(err)
					callback(err,null);
				else if(result.length === 0)
					callback("No user found",null);
				else
					callback(null,result[0]["u"]["_data"]["data"]);
			});
		},
		function(user,callback){
			updatePassword(user,password,callback);
		}
		],
		function(err,result){
			controllerCallback(err,result);
		}
	);
};
module.exports.model = new User();