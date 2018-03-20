var Event = require('../utility/event.js');
//---------------------------------------------------------------------------------
//---------------------------------------------------------------------------------
//---------------------------------------------------------------------------------
//---------------------------------------------------------------------------------
//---------------------------------------------------------------------------------
//  ExperimentGroup
//
function ExperimentGroup(){

    var self = this;

    this.add = function(experiment) { return self._add(experiment); };
    this.calculateScore = function() {return self._calculateScore(self)};
    this.getDotEdge = function(isGlobal) {return self._getDotEdge(self, isGlobal)};
    this.getRelationshipType = function() { return self._getRelationshipType(self); };
    this.agentLabel = function() { return self.experiments[0].agentLabel(); };
    this.targetLabel = function() { return self.experiments[0].targetLabel(); };
    this.agentId = function() { return self.experiments[0].agentId(); };
    this.targetId = function() { return self.experiments[0].targetId(); };
    this.addHypothetical = function(experiment) { self._addHypothetical(self, experiment); };
    this.isHighlighted = function() { return self._isHighlighted(); };
    this.isHypothetical = function() { return self._isHypothetical(self); };
    this.delete = function(callback) { return self._delete(self, callback); };

    var crud = new Event();

    this.experiments = [];
    this.isEmpty = true;
    this.hasInterventionPositive = false;
    this.hasInterventionNegative = false;
    this.hasObservationPositive = false;
    this.hasObservationNegative = false;
    this.hasMediation = false;
    this.hasOnlyEmpirical = false;
    this.hasOnlyHypothetical = false;
    this.crud = crud.register;
    this._crud = crud;
}

//--- delete ------------------------------------------------------------------------------
ExperimentGroup.prototype._delete = function(self, callback) {

    self.crud(callback, true);

    var deleted = 0;

    var experimentDeleted = function() {
        deleted++;
        if (deleted == self.experiments.length) {
            self._crud.fire();
        }
    };

    for (var i=0; i<self.experiments.length; i++){
        self.experiments[i].delete(experimentDeleted);
    }
};

//--- add ------------------------------------------------------------------------------
ExperimentGroup.prototype._add = function(experiment) {
    self = this;
    
    if (self.isEmpty) {
        if (experiment.isHypothetical) {
            self.hasOnlyHypothetical = true;
        }
        else {
            self.hasOnlyEmpirical = true;
        }
        self.isEmpty = false;
    }
    else {
        if (self.hasOnlyHypothetical) {
            if (!experiment.isHypothetical) {
                self.hasOnlyHypothetical = false;
            }
        }
        if (self.hasOnlyEmpirical) {
            if (experiment.isHypothetical) {
                self.hasOnlyEmpirical = false;
            }
        }
    }
    self.experiments.push(experiment);
};

//--- isHighlighted ------------------------------------------------------------------------------
ExperimentGroup.prototype._isHighlighted = function (self) {
    var isHighlighted = false;
    for(var i=0; i<self.experiments.length; i++){
        if (self.experiments[i].isHighlighted) { isHighlighted = true; break; }
    }
    return isHighlighted;
};

//--- isHypothetical ------------------------------------------------------------------------------
ExperimentGroup.prototype._isHypothetical = function (self) {
    var hypothetical = true;
    for(var i=0; i<self.experiments.length; i++){
        if (!self.experiments[i].isHypothetical) { hypothetical = false; break; }
    }
    return hypothetical;
};

//--- addHypothetical ------------------------------------------------------------------------------
ExperimentGroup.prototype._addHypothetical = function (self, hypExp) {
    for (var i=0; i<self.experiments.length; i++){
        var experiment = self.experiments[i];
        if (experiment.uuid == hypExp.uuid){
            experiment.isHypothetical = true;
        }
    }
};

//--- calculateScore ------------------------------------------------------------------------------
ExperimentGroup.prototype._calculateScore = function (self) {

    if (typeof self.score !== "undefined") {
        return self.score;
    }

    var experiments = self.experiments;

    // Get all single-agent experiments
    var singleAgentExperiments = [];
    for (var i=0; i<experiments.length; i++) {
        var experiment = experiments[i];
        if (!experiment.isMediation) {
            singleAgentExperiments.push(experiment);
        }
    }

    // Initialize experiment matrix.
    var experimentMatrix = [];
    experimentMatrix["agentInterventionPositive"] = [];
    experimentMatrix["agentInterventionPositive"]["targetIncrease"] = 1;
    experimentMatrix["agentInterventionPositive"]["targetNoChange"]  = 1;
    experimentMatrix["agentInterventionPositive"]["targetDecrease"]  = 1;

    experimentMatrix["agentObservationPositive"] = [];
    experimentMatrix["agentObservationPositive"]["targetIncrease"] = 1;
    experimentMatrix["agentObservationPositive"]["targetNoChange"] = 1;
    experimentMatrix["agentObservationPositive"]["targetDecrease"]  = 1;

    experimentMatrix["agentObservationNegative"] = [];
    experimentMatrix["agentObservationNegative"]["targetIncrease"]  = 1;
    experimentMatrix["agentObservationNegative"]["targetNoChange"] = 1;
    experimentMatrix["agentObservationNegative"]["targetDecrease"] = 1;

    experimentMatrix["agentInterventionNegative"] = [];
    experimentMatrix["agentInterventionNegative"]["targetIncrease"]  = 1;
    experimentMatrix["agentInterventionNegative"]["targetNoChange"]  = 1;
    experimentMatrix["agentInterventionNegative"]["targetDecrease"] = 1;

    // Calculate experiment matrix.
    var experimentType = "";
    var result = "";
    for (var i = 0; i<singleAgentExperiments.length; i++) {
        experimentType = singleAgentExperiments[i].Manipulation;
        result = singleAgentExperiments[i].Result;
        if (experimentType === "Positive" && result === "Increase") {
            experimentMatrix["agentInterventionPositive"]["targetIncrease"] += 1;
            self.hasInterventionPositive = true;
        }
        else if (experimentType === "Positive" && result === "No Change") {
            experimentMatrix["agentInterventionPositive"]["targetNoChange"] += 1;
            self.hasInterventionPositive = true;
        }
        else if (experimentType === "Positive" && result === "Decrease") {
            experimentMatrix["agentInterventionPositive"]["targetDecrease"] += 1;
            self.hasInterventionPositive = true;
        }
        else if (experimentType === "NIP" && result === "Increase") {
            experimentMatrix["agentObservationPositive"]["targetIncrease"] += 1;
            self.hasObservationPositive = true;
        }
        else if (experimentType === "NIP" && result === "No Change") {
            experimentMatrix["agentObservationPositive"]["targetNoChange"] += 1;
            self.hasObservationPositive = true;
        }
        else if (experimentType === "NIP" && result === "Decrease") {
            experimentMatrix["agentObservationPositive"]["targetDecrease"] += 1;
            self.hasObservationPositive = true;
        }
        else if (experimentType === "NIN" && result === "Increase") {
            experimentMatrix["agentObservationNegative"]["targetIncrease"] += 1;
            self.hasObservationNegative = true;
        }
        else if (experimentType === "NIN" && result === "No Change") {
            experimentMatrix["agentObservationNegative"]["targetNoChange"] += 1;
            self.hasObservationNegative = true;
        }
        else if (experimentType === "NIN" && result === "Decrease") {
            experimentMatrix["agentObservationNegative"]["targetDecrease"] += 1;
            self.hasObservationNegative = true;
        }
        else if (experimentType === "Negative" && result === "Increase") {
            experimentMatrix["agentInterventionNegative"]["targetIncrease"] += 1;
            self.hasInterventionNegative = true;
        }
        else if (experimentType === "Negative" && result === "No Change") {
            experimentMatrix["agentInterventionNegative"]["targetNoChange"] += 1;
            self.hasInterventionNegative = true;
        }
        else if (experimentType === "Negative" && result === "Decrease") {
            experimentMatrix["agentInterventionNegative"]["targetDecrease"] += 1;
            self.hasInterventionNegative = true;
        }
        else {
            console.log("Experiment " + experiment.uuid + " is corrupt: its Manipulation or Result (or both) is invalid.");
        }
    }

    // Calculate the denominator for each empirical probability calculation.
    denominatorInterventionPositive =     experimentMatrix["agentInterventionPositive"]["targetIncrease"]
                                        + experimentMatrix["agentInterventionPositive"]["targetNoChange"]
                                        + experimentMatrix["agentInterventionPositive"]["targetDecrease"];

    denominatorObservationPositive  =     experimentMatrix["agentObservationPositive"]["targetIncrease"]
                                        + experimentMatrix["agentObservationPositive"]["targetNoChange"]
                                        + experimentMatrix["agentObservationPositive"]["targetDecrease"];

    denominatorObservationNegative  =     experimentMatrix["agentObservationNegative"]["targetIncrease"]
                                        + experimentMatrix["agentObservationNegative"]["targetNoChange"]
                                        + experimentMatrix["agentObservationNegative"]["targetDecrease"];

    denominatorInterventionNegative =     experimentMatrix["agentInterventionNegative"]["targetIncrease"]
                                        + experimentMatrix["agentInterventionNegative"]["targetNoChange"]
                                        + experimentMatrix["agentInterventionNegative"]["targetDecrease"];

    scoreExcitatory = (1.0/4) * (  (experimentMatrix["agentInterventionPositive"]["targetIncrease"] / denominatorInterventionPositive)
                                 + (experimentMatrix["agentObservationPositive"]["targetIncrease"]  / denominatorObservationPositive)
                                 + (experimentMatrix["agentObservationNegative"]["targetDecrease"]  / denominatorObservationNegative)
                                 + (experimentMatrix["agentInterventionNegative"]["targetDecrease"] / denominatorInterventionNegative) );

    scoreNoConnection = (1.0/4) * (  (experimentMatrix["agentInterventionPositive"]["targetNoChange"] / denominatorInterventionPositive)
                                   + (experimentMatrix["agentObservationPositive"]["targetNoChange"]  / denominatorObservationPositive)
                                   + (experimentMatrix["agentObservationNegative"]["targetNoChange"]  / denominatorObservationNegative)
                                   + (experimentMatrix["agentInterventionNegative"]["targetNoChange"] / denominatorInterventionNegative) );

    scoreInhibitory = (1.0/4) * (  (experimentMatrix["agentInterventionPositive"]["targetDecrease"] / denominatorInterventionPositive)
                                 + (experimentMatrix["agentObservationPositive"]["targetDecrease"]  / denominatorObservationPositive)
                                 + (experimentMatrix["agentObservationNegative"]["targetIncrease"]  / denominatorObservationNegative)
                                 + (experimentMatrix["agentInterventionNegative"]["targetIncrease"] / denominatorInterventionNegative) );

    var scoreDominant = Math.max(scoreExcitatory,scoreNoConnection,scoreInhibitory);

    // Find the maximum score among the three scores.
    var maxScoreCount = 0;
    maxScoreCount = scoreDominant == scoreExcitatory   ? maxScoreCount + 1 : maxScoreCount;
    maxScoreCount = scoreDominant == scoreNoConnection ? maxScoreCount + 1 : maxScoreCount;
    maxScoreCount = scoreDominant == scoreInhibitory   ? maxScoreCount + 1 : maxScoreCount;

    // If two or more scores equal the maximum, do not assign a relationship type to this edge
    // and do not return a score.
    if (maxScoreCount > 1) {
        self.relationshipType = null;
        return;
    }

    // If there is one maximum score, assign the relationship type and score for the edge appropriately.
    self.relationshipType = scoreExcitatory == scoreDominant ? "Excitatory" : scoreInhibitory == scoreDominant ? "Inhibitory" : "No Relation";
    // So that scores can be interpreted as "an amount of information," and not an empirical probability,
    // subtract 1/3 from the score (its starting value in the uniform distribution) and then divide by
    // 1 - (1/3) = 2/3 so that the scores are scaled to the range [0,1).
    self.score = Number(((scoreDominant-(1/3))/(2/3)).toFixed(4));
    return self.score;
    
};

//--- getDotEdge ------------------------------------------------------------------------------
ExperimentGroup.prototype._getDotEdge = function (self, isGlobal) {

    if (typeof isGlobal === 'undefined') { isGlobal = false; }
    var agentLabel = self.agentLabel();
    var targetLabel = self.targetLabel();

    var spacePart = '     ';
    var arrowPart = agentLabel +  ' -> ' +  targetLabel;

    var relationshipType = self._getRelationshipType(self);
    var arrowheadStr = "";
    if (relationshipType == "Inhibitory") {
        arrowheadStr = " arrowhead = tee";
    }
    if (relationshipType == "No Relation") {
        arrowheadStr = " arrowhead = dot";
    }
    if (relationshipType == null) {
        arrowheadStr = " arrowhead = diamond";
    }
    var isHighlighted = false;
    if(!isGlobal) {
        isHighlighted = self._isHighlighted(self);
    }
    var isHypothetical = self._isHypothetical(self);
    var styleStr = relationshipType == "No Relation" ? " style = dotted, " : "";
    var colorStr = '';
    var thicknessStr = '';
    if (isHypothetical) {
        if (isHighlighted) {
            colorStr = ' color = "#FAD9A8" '; // RGB = (250, 217, 168) = #FAD9A8 (light orange)
            thicknessStr = ' penwidth = 3 ';
        }
        else {
            colorStr = ' color = "#CDCDCD" '; // RGB = (205, 205, 205) = #CDCDCD (gray)
            thicknessStr = ' penwidth = 2 ';
        }
    }
    else {
        if (isHighlighted) {
            colorStr = ' color = "#EDA43C" '; // RGB = (237, 164, 60) = #EDA43C (orange)
            thicknessStr = ' penwidth = 3 ';
        }
        else {
            colorStr = ' '; // take default color (black)
        }
    }
    var experimentLabelStr = self.hasInterventionPositive ? "↑ " : "";
    experimentLabelStr = self.hasInterventionNegative ? experimentLabelStr + "↓ " : experimentLabelStr;
    experimentLabelStr = self.hasObservationPositive ? experimentLabelStr + "∅↑ " : experimentLabelStr;
    experimentLabelStr = self.hasObservationNegative ? experimentLabelStr + "∅↓ " : experimentLabelStr;
    //experimentLabelStr = self.hasMediation ? experimentLabelStr + "▽" : experimentLabelStr;
    experimentLabelStr =  isHypothetical ? "" : experimentLabelStr;
    var scoreStr = relationshipType == null ? "" : ' label = "' +  self.score + " " + experimentLabelStr + '"';
    scoreStr = isHypothetical ? "" : scoreStr;
    var commaStr = relationshipType == "Excitatory" || relationshipType == null ? "" : ", ";
    var edgeLabelPart = ' [ ' + styleStr + colorStr + thicknessStr + arrowheadStr + commaStr + scoreStr + ' ];';

    return spacePart + arrowPart + edgeLabelPart;
};

//--- getRelationshipType ------------------------------------------------------------------------------
ExperimentGroup.prototype._getRelationshipType = function (self) {

    if (typeof self.relationshipType == "undefined") {
        self._calculateScore(self);
    }

    return self.relationshipType;
};

//---------------------------------------------------------------------------------
//---------------------------------------------------------------------------------

module.exports = ExperimentGroup;