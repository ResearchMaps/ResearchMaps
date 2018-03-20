var paper = require('../models/paper.js')
, experiment = require('../models/graphExperiment.js')
, excel = require('excel')
, async = require('async')
, types = require('./Types.json');

function Import(){

}
//Namespace this
var nextElementCounter = 1;
var excelData;
var currentPaperTitle = "";
var currentPaperUuid = "";

Import.prototype.xlsxImport = function(){
	excel('import/PapersAndData.xlsx', function(err, data) {
		if(err) throw err;
		else{
			excelData = data.slice(1,data.length);
			console.log("Commencing import");
			var count = 0;
			async.eachSeries(excelData,populateDB,function(err,result){
				console.log("Imported row " + count);
				count+=1;
			});
		}
	});
}
var populateDB = function(element,callback){
	var nextElement = excelData[nextElementCounter];
	console.log("Element is " + JSON.stringify(element));
	console.log("Next element is " + JSON.stringify(nextElement));
	console.log(JSON.stringify(element[1]));
	if(element[1] === ""){
		//Insert Paper
		console.log("Maybe paper");
		currentPaperTitle = element[0];
		addPaper(element[0],"public",function(err,uuid){
			if(err)
				console.log("Error while adding paper : " + err);
			else{
				currentPaperUuid = uuid;
				console.log("UUID is " + uuid);
				console.log("Added paper successfully");
			}
			nextElementCounter++;
			callback(err,uuid);
		});
	}
	else {
		console.log("Maybe experiment");
		var experimentData =
		{
			Agent:element[0],
			AgentApproach:element[2],
			Manipulation:element[1],
			Target:element[3],
			TargetApproach:element[5]
		};
		var mapResult = {
			"Positive":"Increase",
			"Negative":"Decrease",
			"None":"No Change"
		};
		experimentData.Result = mapResult[element[4]];
		if(nextElementCounter < excelData.length-1 && nextElement[9] === "" && nextElement[1] !== ""){
			console.log("Mediation experiment");
			experimentData.WhatSecondAgent = nextElement[0];
			experimentData.SecondManipulation = nextElement[1];
			experimentData.SecondAgentApproach = nextElement[2];
		}

		if(element[9] === ""){
			nextElementCounter++;
			callback(null,null);
			return;
		}

		var agent = {
			What:element[0],
			Where:null,
			When:null
		};
		
		var target = {
			What:element[3],
			Where:null,
			When:null
		};
		addExperiment(currentPaperUuid,experimentData,agent,target,function(err,results){
			if(err)
				console.log("Error while adding experiment: " + err);
			else{
				console.log("Added experiment successfully");
			}
			nextElementCounter++;
			callback(err,results);
		});
	}
}
var pausecomp = function(millis)
 {
	var date = new Date();
	var curDate = null;
	do { curDate = new Date(); }
	while(curDate-date < millis);
}

var addPaper = function(title,username,callback){
	var data = {
		index:["title",title]
	};
	
	var source = {
		nodeType:types.node.USER,
		index:["username",username]
	};
	var destination = {
		nodeType:types.node.PAPER,
		index:["title",title]
	};

	paper.model.addPaper("no",data,source,destination,callback);
};

var addExperiment = function(uuid,experimentData,agent,target,callback){
	var paperData = {uuid:uuid};

	experiment.model.addExperiment("public",paperData,experimentData,agent,target,callback);	
};

module.exports = new Import();