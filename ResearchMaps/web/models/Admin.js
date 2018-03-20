/**
 * Create and approve users who sign up on the website
 * @module Admin
 */

var DB = require('./DBobject.js')
, graphDB = DB.graphDB
, async = require('async')
, types = require('./Types.json')
, crypto = require('crypto')
, uuid = require('node-uuid');;

/**
* A class that defines two methods to create/approve users.
* @class Admin
* @constructor
*/

function Admin(){}

Admin.prototype.fixBrokenPasswords = function(controllerCallback){
	var query = [
		"MATCH (u:User)",
		"Where u.username='' or u.username='' or u.username=''" + 
		" or u.username='' or u.username='' or u.username=''" + 
		" or u.username='' or u.username='' or u.username=''",
		" or u.username='' or u.username=''",
		"RETURN u"
	].join("\n");
	console.log(query);
	var _self = this;
	graphDB.instance.query(query,null,function(err,results){
		if(err)
			console.log(err);
		else{
			var users = {};
			async.eachSeries(results,
				function(result,callback){
					var user = result["u"]["_data"]["data"];
					_self.approveUser(user.username,function(err,password){
						if(err)
							console.log(err);
						else{
							users[user.username] = password;
							callback(err,null);
						}
					});
				},
				function(err){
					console.log(JSON.stringify(users));
					controllerCallback(err,users);
				}
			);
		}
	});
}

/**
 * Create a new user node in the system. Used when the user signs up.
 * Status is Not approved.
 * @method createUser
 * @async
 * @param {Object} user Specifies the user's information.
 * @param {Function} controllerCallback calling function's callback to be executed once the user node is created or error occurred.
 * @return None
 */

Admin.prototype.createUser = function(user,controllerCallback) {
	user["status"] = "Not approved";
	user["username"] = user["email"];
	user["uuid"] = uuid.v4();
	delete user["email"];
	user["index"] = ["username",user["username"]];
	user["editorStatus"] = false;
	graphDB.mergeNode(types.node.USER,user,function(err,results){
		controllerCallback(err,results);
	});
};

/**
 * Returns a list of all users in the system. Used in the Admin page of researchmaps.org.
 * @method getAllUsers
 * @async
 * @param {Function} controllerCallback calling function's callback to be executed once all the users are found in DB or error occurred.
 * @return None
 */
Admin.prototype.getAllUsers = function(controllerCallback){
	graphDB.findNode(types.node.USER,null,function(err,results){
		if(results.length>0){
			var resultArray = [];
			results.forEach(function(element){
				if(element["node"]["_data"]["data"]["status"] === "Approved")
					element["node"]["_data"]["data"]["boolStatus"] = true;
				resultArray.push(element["node"]["_data"]["data"]);
			});
			controllerCallback(err,resultArray);
		}
		else
			controllerCallback(err,results);
	});
};

/**
 * Approve a user identified by his email address.
 * Generates random password for this user which is then emailed using the controller class.
 * @method approveUser
 * @async
 * @param {String} email Specifies the user's email address.
 * @param {Function} controllerCallback calling function's callback to be executed once the user is found in DB or error occurred.
 * @return None
 */
Admin.prototype.approveUser = function(email,controllerCallback){
	try{
		var salt = crypto.randomBytes(32).toString('hex');
		var password = crypto.randomBytes(8).toString('hex');
	}
	catch(err){
		controllerCallback(err,null);
	}
	crypto.pbkdf2(password, salt, 10000, 512, function(err, derivedKey) {
		var hash = derivedKey.toString('hex');
		var query = [
						"MATCH (u:User)",
						"where u.username = {email}",
						"SET u.status = 'Approved'",
						"SET u.hash={hash}",
						"SET u.salt={salt}",
						"Return u"
		].join("\n");
		var params = {
			"email":email,
			"hash":hash,
			"salt":salt
		};
		graphDB.instance.query(query,params,function(err,results){
			controllerCallback(err,password);
		});
	});
};

Admin.prototype.removeUser = function(email,controllerCallback){

};

module.exports.model = new Admin();