/**
 * Provides the ScoringSystem class used to score each edge from neo4j. 
 * Used by grah module to calculate real/virtual scores.
 * @module ScoringSystem
 */

/**
* A class to score each edge obtained from neo4j.
* @class ScoringSystem
* @constructor
*/

function ScoringSystem(){}

/**
 * Calculate virtual score of the edge.
 *
 * Ignore neo4j's input scores for each relationship type and start from scratch.
 *
 * @method virtualScore
 * @param {String[]} edge the edge to be scored. An edge is just an array of the vertices it connects.
 * @param {Object} experiment The experiment object describing the experiment performed.
 * @return {Object} describing score, label and edgeType(Excitatory/Inhibitory/No relation)
 */
ScoringSystem.prototype.virtualScore = function(edge,experiment){

	var getMaxScore = function(scoreList,edge){

		var score = 0;
		var sum = 0;
		var count = 0;
		var max = 0;
		var label = '';
		console.log("finding max score");
		for(var conclusion in scoreList[edge]){
			sum+=scoreList[edge][conclusion].score;
			if(scoreList[edge][conclusion].score > max){
				max = scoreList[edge][conclusion].score;
				label = scoreList[edge][conclusion].label;
			}
		}
		console.log("finding max score count");
		for(var conclusion in scoreList[edge]){
			if(scoreList[edge][conclusion].score === max)
				count+=1;
		}
		console.log(JSON.stringify(scoreList));
		if(count > 1){
			return {
				score:'',
				label:'',
				edgeType:''
			}
		}
		score = Number((max*max/sum).toFixed(3));
		return {
			score:score,
			label:label,
			edgeType:conclusion
		};
	}

	var edgeTypes = ["Excitatory","Inhibitory","No relation"];
	var map = {
		"Positive":"↑",
		"Negative":"↓",
		"NIN":"∅",
		"NIP":"∅",
		"Mediation":"▽"
	};
	var scoreList = this.scoreList;
	var manipulation = experiment["Manipulation"];

	if(experiment.WhatSecondAgent)
		manipulation = "Mediation";

	var conclusion = experiment["conclusion"];
	
	if(conclusion === "No conclusion")
		return getMaxScore(scoreList,edge);

	console.log("adding another score");
	if(scoreList[edge] && scoreList[edge][conclusion] && scoreList[edge][conclusion][manipulation]){
		scoreList[edge][conclusion][manipulation].count+=1;
		scoreList[edge][conclusion][manipulation].score = 0.25*(1 - Math.pow(0.5,scoreList[edge][conclusion][manipulation].count));
	}
	else{
		if(!scoreList[edge]){
			scoreList[edge] = {};
		}
		if(!scoreList[edge][conclusion]){
			scoreList[edge][conclusion] = {};
		}
		scoreList[edge][conclusion][manipulation] =  {
			score:0.125,
			count:1
		}
	}
	console.log("updating overall score");
	for(var conclusion in scoreList[edge]){
		console.log("conclusion is " + conclusion);
		scoreList[edge][conclusion].score = 0;
		scoreList[edge][conclusion].label = '';
		console.log("Updating individual scores");
		for(var manipulation in scoreList[edge][conclusion]){
			if(manipulation !=="score" && manipulation!=="label"){
				scoreList[edge][conclusion].score+=scoreList[edge][conclusion][manipulation].score;
				scoreList[edge][conclusion].label+=map[manipulation];
			}
		}
		console.log("Score is " + scoreList[edge][conclusion].score);
	}
	return getMaxScore(scoreList,edge);
}

/**
 * Initializes score list to an empty array.
 *
 * @method initializeList
 *
 * @return None
 */
ScoringSystem.prototype.initializeList = function(){
	this.scoreList = {};
}

/**
 * Calculate real score used by the MAP page.
 *
 * Uses neo4j's input scores for each relationship type and adds them up.
 *
 * @method calculateScore
 * @param {Object} rScore Object describing the scores for each of Excitatory/Inhibitor/No Relationship.
 * Ex:
 * {
	"Excitatory":{
		"Positive":...,
		"Negative":...,
		"Non-Intervention":...,
		"Mediation":...
	},
	"Inhibitory":{
		"Positive":...,
		"Negative":...,
		"Non-Intervention":...,
		"Mediation":...
	},
	...
 }
 * @return {Object} describing score, label and edgeType(Excitatory/Inhibitory/No relation)
 */

ScoringSystem.prototype.calculateScore = function(rScore){
	var scores = [];
	var max = 0;
	var maxCount = 0;
	var sum = 0;
	var labels = '';
	var rType;
	var map = {
		"Positive":"↑",
		"Negative":"↓",
		"Non-Intervention":"∅",
		"Mediation":"▽"
	};

	// Initialize variable to store only the scores for all double-intervention experiments.
	var doubleConnectionTotalScore = 0;

	// Loop through each relationship (a.k.a. conclusion) type (in this outer loop).
	// Relationship/conclusion types: Excitatory, Inhibitory, No Relation, No conclusion
	// ("No conclusion" is used only for undefined results of double-intervention experiments.)
	for(var conclusion in rScore){
		// Reset total to zero for current iteration's relationship/conclusion type.
		var total = 0;
		// Loop through through each experiment type (in this inner loop).
		// Experiment types: Positive, Negative, Non-Intervention, Mediation
		for(var experimentType in rScore[conclusion]){
			// Ensure that appropriate symbol(s) (i.e., ↑, ↓, ∅, and ▽) appear on
			// edge for each experiment type that was performed for that edge.
			// If score is non-zero, and experiment label (↑, ↓, ∅, ▽) hasn't been added to edge yet...
			if(rScore[conclusion][experimentType].score!==0 && labels.indexOf(map[experimentType]) === -1){
				// The "labels" array contains the symbols of each experiment type
				// that was performed on particular edge. In the map, these symbols
				// appear on each edge to convey which types of experiments were
				// performed for a particular pair of phenomena.
				// If condition above is satisfied, add the appropriate experiment label
				// to the array of labels.
				labels+=map[experimentType];
			}
			// Check whether current experiment is a double-intervention experiment
			if(experimentType === "Mediation"){
				// Add score of this double-intervention experiment to the separate,
				// double-intervention total.
				doubleConnectionTotalScore += rScore[conclusion][experimentType].score;
			}
			else{
				// Experiment is a single-intervention experiment; add score to total.
				// In the context of each conclusion (Excitatory, Inhibitory, No relation, No conclusion),
				// the "total" is the score for all of the experiments for that particular conclusion.
				// With each iteration of the outer for loop, we total the score for each
				// conclusion type separately.
				total+=rScore[conclusion][experimentType].score;
			}
		}
		//console.log("\n total = " + total + "\n");
		//console.log("\n doubleConnectionTotalScore = " + doubleConnectionTotalScore + "\n");
		// Put total for that experiment type in scores array
		scores.push(total);
		// Assign new max if experiment type has the highest score yet
		if(total > max){
			max = total;
			rType = conclusion;
		}
	}
	//console.log("\n max = " + max + "\n");

	// This for loop and following if-else perform the calculations
	// for the (max/overall) * max algorithm developed by Pranay.
	for( var score in scores){
		if(scores[score] === max){
			maxCount+=1;
		}
		sum+=scores[score];
	}

	if(maxCount > 1){
		// If two or more conclusions have equal evidence, there is no winner.
		max = 0;
		rType = "None";
	}
	else{
		// Determine if there is single-intervention evidence for more than one edge type.
		var isConflictingEvidence = false;
		if (((scores[0] > 0) && (scores[1] > 0)) ||
			((scores[0] > 0) && (scores[2] > 0)) ||
			((scores[1] > 0) && (scores[2] > 0))) {
			isConflictingEvidence = true;
		}
		// Add double-intervention evidence to the dominant evidence from single-intervention experiments.
		// Per #413, add double-intervention evidence IF AND ONLY IF there is not single-intervention evidence
		// for more than one edge type.
		if (!isConflictingEvidence) {
			// Add double-intervention experiments' score to dominant total for single-intervention experiments
			max += doubleConnectionTotalScore;
			// Add double-intervention experiments' score to sum of all scores
			sum += doubleConnectionTotalScore;
		}
		// Discount dominant conclusion's score per conflicting evidence.
		max = max * max/sum;
		max = Number(max.toFixed(3));
	}

	return {
		label:labels,
		max:max,
		rType:rType
	};
}

module.exports = new ScoringSystem();