var admin = require('../models/Admin.js')
, dust = require('dustjs-linkedin')
, mailer = require('./email.js')()
, sender = require('../config/mailConfig.json')
, fs = require('fs');

function Admin(){}
function escapeHtml(unsafe) {
	return unsafe
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
};

Admin.prototype.fixBrokenPasswords = function(){
	admin.model.fixBrokenPasswords(function(err,passwords){
		if(err)
			console.log(err);
		else{
			for(user in passwords){
				dust.render('approveMessage',{"email":user,"password":passwords[user]},function(err,approveContent){
					var mailContents = {
						"source":sender["email"],
						"sourcePass":sender["password"],
						"sourceService":sender["service"],
						"destination":user,
						"subject":"Approved for ResearchMaps use",
						"content": approveContent
					};
					mailer.send(mailContents);
				});
			}
		}
	});
}

Admin.prototype.contact = function(request,response){
	var content = [
		"Hi,",
		"You received the following message from " + request.body.name + "<" + request.body.email + ">",
		"---------------------------------------------------------------------------------------------",
		"Message Start",
		request.body.content,
		"Message End",
		"---------------------------------------------------------------------------------------------"
	].join('\n');
	var mailContents = {
		"source":sender["email"],
		"sourcePass":sender["password"],
		"sourceService":sender["service"],
		"destination":"emailaddress@domain.com",
		"subject":"ResearchMaps: Message from " + request.body.name,
		"content": content
	};
	mailer.send(mailContents);
	response.json("Message succesfully sent");
};
Admin.prototype.createUser = function(request, response){
	if(request.body.digits !== request.session.captcha){
		var params = {};
		for(key in request.body)
			params[key] = escapeHtml(request.body[key]);
		params["_csrf"] = null;
		console.log(JSON.stringify(params));
		dust.render('requestaccount',params,function(err,html){
			if(err)
				response.send(err);
			else
				response.send(html);
		})
	}
	else{
		delete request.body["_csrf"];
		delete request.body["digits"];
		admin.model.createUser(request.body,function(err,results){
			if(err)
				response.send(err);
			else{
				response.send("Thank you for requesting an account for ResearchMaps!");
				var content = [
								"Hi,",
								"A new user (" + request.body.firstName + " " + request.body.lastName + "; " + request.body.username + ") " +
								"has registered."
				].join("\n\n");
				var mailContents = {
					"source":sender["email"],
					"sourcePass":sender["password"],
					"sourceService":sender["service"],
					"destination":"emailaddress@domain.com",
					"subject":"ResearchMaps: New user has signed up",
					"content":  content
				};
				mailer.send(mailContents);
			}
		});
	}
};

Admin.prototype.getAllUsers = function(request,response){
	admin.model.getAllUsers(function(err,results){
		if(err)
			response.send(err);
		else{
			dust.render('admin',{"results":results,"_csrf":null},function(err,html){
				if(err)
					response.send(err);
				else
					response.send(html);
			});
		}
	});
};

Admin.prototype.approveUser = function(request,response){
	var email = request.body.email;
	admin.model.approveUser(email,function(err,password){
		if(err)
			response.json(err);
		else{
			dust.render('approveMessage',{"email":email,"password":password},function(err,approveContent){
				var mailContents = {
					"source":sender["email"],
					"sourcePass":sender["password"],
					"sourceService":sender["service"],
					"destination":email,
					"subject":"Approved for ResearchMaps use",
					"content": approveContent
				};
				mailer.send(mailContents);
				response.json("Success");
			});
		}
	});
};
module.exports.controller = new Admin();