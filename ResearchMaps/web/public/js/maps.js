//---------------------------------------------------------------------------------
//---------------------------------------------------------------------------------
//---------------------------------------------------------------------------------
//---------------------------------------------------------------------------------
//---------------------------------------------------------------------------------
//  Maps
//
function Maps() {}
//---------------------------------------------------------------------------------
Maps.Hacks = {};
//---------------------------------------------------------------------------------
Maps.Hacks.pubmedSearch_clicked = function() {
    var a = $("#btnSearch");
    var isOff = a.hasClass("btn-default");
    if (isOff) {
        a.removeClass("btn-default");
        a.addClass("btn-primary");
    }
    else {
        a.removeClass("btn-primary");
        a.addClass("btn-default");
    }
    return false;
};
//---------------------------------------------------------------------------------
Maps.Hacks.queryPubmed = function(first, second) {

    $('#modalDivInfo').empty();
    $('#divWait').html('<table style="width: 100%"><tr><td style="text-align: center"><i class="fa fa-spinner fa-pulse fa-5x fa-fw"></i></td></tr></table>');

    $('#secondModal').modal('show');
    $('#divWait').removeClass("hidden");
    var data = {};
    data.first = first;
    data.second = second;

    var ajaxOptions = {};
    ajaxOptions.type = "GET";
    ajaxOptions.url = '/pubSearch';
    ajaxOptions.data = data;
    ajaxOptions.success = function (data) {
        $('#divWait').addClass("hidden");
        $('#tdFirst').text(first);
        $('#tdSecond').text(second);
        for (var i=0; i<data.length; i++){
            var cur = data[i];
            var hrefString = cur.trim().replace(/\s/g, '+');
            var href = 'http://www.ncbi.nlm.nih.gov/pubmed/?term=' + hrefString;
            var a = i==0 ? $("<a href='" + href + "' style='font-size: 0.9em; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; display: block'>" + cur + "</a>") : $("<a href='" + href + "' style='font-size: 0.9em; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; display: block; padding-top: 10px'>" + cur + "</a>");
            $('#modalDivInfo').append(a);
        }
    };
    ajaxOptions.contentType = "application/json";
    $.ajax(ajaxOptions);
};
//---------------------------------------------------------------------------------
Maps.Hacks.loadPubmed = function() {
    d3.selectAll("g.edge path").on("click",
        function(p1, p2) {
            var path = $(this);
            var title = path.parent().find("title").text();
            var arrowSplit = title.split('->');
            var first = arrowSplit[0].split('\n')[0];
            var second = arrowSplit[1].split('\n')[0];
            Maps.Hacks.queryPubmed(first, second);
        }
    );
};
//--- setEditExperiment ------------------------------------------------------------------------------
Maps.Hacks.setEditExperiment = function(uuid) {
    var result = Maps.Hacks.Vars.results[uuid];
    $("#eStatTest").val(result.StatTest);
    $("#epvalue").val(result.pvalue);
    $("#efoldChange").val(result.foldChange);
};
//--- updatePassword ------------------------------------------------------------------------------
Maps.Hacks.updatePassword = function() {
    $('#submit').click(function(){
        var newPassword = $('#password').val();
        var confirmPassword = $('#confirmPassword').val();
        if(newPassword !== confirmPassword){
            $('#passwordError').removeClass('hidden');
            return;
        }
        else{
            var uuid= window.location.href.split('/')[4];
            var csrf = $('#_csrf').val();

            var data = {};
            data.password = newPassword;

            var ajaxOptions = {};
            ajaxOptions.type = "PUT";
            ajaxOptions.url = '/updatePassword/' + uuid;
            ajaxOptions.data = JSON.stringify(data);
            ajaxOptions.success = function (data) {
                var widgets = new Maps.Widgets();
                $("#content_divider_line").after(widgets.alert("Password updated successfully"));
            };
            ajaxOptions.contentType = "application/json";
            $.ajax(ajaxOptions);
        }
    });
};

//--- local ------------------------------------------------------------------------------
Maps.Hacks.checkPassword = function(caller) {

    var pwd = $("#password");
    var pwdVal = pwd.val();
    var un = $("#username");
    var unVal = un.val();

    var data = {};
    data.username = unVal;
    data.password = pwdVal;

    var ajaxOptions = {};
    ajaxOptions.type = "GET";
    ajaxOptions.url = "/checkPassword";
    ajaxOptions.data = data;
    ajaxOptions.success = function (data) {
        if (data == "worked") {
            $("#frmLogin")[0].submit();
        }
        else {
            var widgets = new Maps.Widgets();
            $("legend").after(widgets.error("Incorrect Username or Password!"));
        }
    };
    ajaxOptions.contentType = "application/json";
    $.ajax(ajaxOptions);
};

//--- local ------------------------------------------------------------------------------
Maps.Hacks.typesetSuperscripts = function(caller) {

    // In map, adjust typesetting of Non-intervention symbols to use superscripts
    var t = $("text:contains('∅↑')");
    if (t.length === 0) {
        return;
    }
    var arr = t.html().split("∅↑");
    for (var i=1; i<arr.length; i++) {
        arr[i] = arr[i].substr(1);
    }
    t.html(arr.join('∅<tspan dy="-.7em" style="font-size:9px">↑</tspan><tspan dy=".7em" style="font-size:9px; opacity: 0">↑</tspan>'));

    t = $("text:contains('∅↓')");
    if (t.length === 0) {
        return;
    }
    arr = t.html().split("∅↓");
    for (i=1; i<arr.length; i++) {
        arr[i] = arr[i].substr(1);
    }
    t.html(arr.join('∅<tspan dy="-.7em" style="font-size:9px">↓</tspan><tspan dy=".7em" style="font-size:9px; opacity: 0">↓</tspan>'));

};
//--- setVars ------------------------------------------------------------------------------
Maps.Hacks.setVars = function() {
    var div = $("#_divHack");
    var results = JSON.parse(div.text());
    var results_map = {};
    for (var i=0; i<results.length; i++) {
        var result = results[i];
        results_map[result.uuid] = result;
    }
    Maps.Hacks.Vars = {};
    Maps.Hacks.Vars.results = results_map;
};

//--- popDialog ------------------------------------------------------------------------------
Maps.Hacks.popDialog = function(uuid) {
    var div = $("#_divHack");
    var result = Maps.Hacks.Vars.results[uuid];
    var exp_div = $('#experiment');
    var idx = exp_div.find("thead").find("th:contains('Statistical Test')").index();
    exp_div.find("tbody").find("td").eq(idx).text(result.StatTest);
    exp_div.find("tbody").find("td").eq(idx+1).text(result.pvalue);
    
    idx = exp_div.find("thead").find("th:contains('Fold Change')").index();
    exp_div.find("tbody").find("td").eq(idx).text(result.foldChange);
};
//*********************************************************************************
//  Utility
//*********************************************************************************

Maps.modal = function(modalId) {
    var modalDiv = $("#" + modalId);
    modalDiv.modal("show");
    modalDiv.data('bs.modal', null);
};

//--- local ------------------------------------------------------------------------------
Maps.local = function(fun){
    fun();
};

//----- array -----------------------------------------------------------------
Maps.array = function (obj) {

    if(!(Object.prototype.toString.call(obj) === '[object Array]')) {
        return [obj];
    }

    return obj;
};

//----- has -----------------------------------------------------------------
Maps.has = function (properties) {

    if(!(Object.prototype.toString.call(properties) === '[object Array]')) {
        return typeof  properties != "undefined";
    }

    for (var i=0; i<properties.length; i++){
        if (typeof properties[i] == "undefined"){
            return false;
        }
    }

    return true;
};

//----- nullOrWhite -----------------------------------------------------------------
Maps.nullOrWhite = function (str) {

    if (!Maps.has(str)) { return true; }

    return (str === null || str.match(/^ *$/) !== null);
};

//----- sanitizeUserInput -----------------------------------------------------------
Maps.sanitizeUserInput = function (str) {

    return str
        .replace(/'/g, '′')  // straight single quote (&#39;) → single prime (&prime;)
        .replace(/"/g, '″'); // straight double quote (&#34;) → double prime (&Prime;)
};

//---------------------------------------------------------------------------------
//---------------------------------------------------------------------------------
//---------------------------------------------------------------------------------
//---------------------------------------------------------------------------------
//---------------------------------------------------------------------------------
//  Event
//
Maps.Event = function () {
    var self = this;
    this.register = function (handler) { if (!Maps.has(handler)) { return; } self.Handlers.push(handler); };
    this.fire = function (event) { for (var i = 0; i < self.Handlers.length; i++) { self.Handlers[i](event, this, arguments.callee.caller); } };
    this.Handlers = [];
};

//---------------------------------------------------------------------------------
//---------------------------------------------------------------------------------
//---------------------------------------------------------------------------------
//---------------------------------------------------------------------------------
//---------------------------------------------------------------------------------
//  Widgets
//
Maps.Widgets = function () {
    var self = this;
    this.alert = function (message) { return self._alert(self, message); };
    this.error = function (message) { return self._error(self, message); };
};

//--- error ------------------------------------------------------------------------------
Maps.Widgets.prototype._error = function (self, message) {
    var html =  '<div class="alert alert-danger alert-dismissible" role="alert">';
    html +=         '<button type="button" class="close" data-dismiss="alert">';
    html +=             '<span aria-hidden="true">&times;</span>';
    html +=             '<span class="sr-only">Close</span>';
    html +=         '</button>';
    html +=         message;
    html +=     '</div>';
    return $(html);
};

//--- alert ------------------------------------------------------------------------------
Maps.Widgets.prototype._alert = function (self, message) {
    var html =  '<div class="alert alert-success alert-dismissible" role="alert">';
    html +=         '<button type="button" class="close" data-dismiss="alert">';
    html +=             '<span aria-hidden="true">&times;</span>';
    html +=             '<span class="sr-only">Close</span>';
    html +=         '</button>';
    html +=         message;
    html +=     '</div>';
    return $(html);
};

//---------------------------------------------------------------------------------
//---------------------------------------------------------------------------------
//---------------------------------------------------------------------------------
//---------------------------------------------------------------------------------
//---------------------------------------------------------------------------------
//  Login
//
Maps.Login = function () {
    var self = this;

    $('.modal-footer').find("#forgotPassword").click(function(){
        // Get the username from the form.
        var username = $('#forgotUsername').val();
        
        var ajaxOptions = {};
        ajaxOptions.type = "GET";
        ajaxOptions.url = "/forgotPassword";
        ajaxOptions.data = {"username":username};
        ajaxOptions.success = function (data) {
            $('.modal-body').empty();
            $('.modal-footer').find("#forgotPassword").hide()
            $('.modal-body').append('<p>Check your email inbox for a password recovery link.</p>');
        };
        ajaxOptions.contentType = "application/json";
        $.ajax(ajaxOptions);
    });
};

//---------------------------------------------------------------------------------
//---------------------------------------------------------------------------------
//---------------------------------------------------------------------------------
//---------------------------------------------------------------------------------
//---------------------------------------------------------------------------------
//  Article
//
Maps.Article = function (id) {
    var self = this;

    this.makePrivate = function() { self._makePrivate(self); };
    this.delete = function(callback) { self._delete(self, callback); };

    var madePrivate = new Maps.Event();
    var crud = new Maps.Event();

    this._madePrivate = madePrivate;
    this.madePrivate = madePrivate.register;
    this._crud = crud;
    this.crud = crud.register;

    this.id = id;
};

//--- delete ------------------------------------------------------------------------------
Maps.Article.prototype._delete = function (self, callback) {

    self.crud(callback);

    var data = {};
    data.id = self.id;

    var ajaxOptions = {};
    ajaxOptions.type = "GET";
    ajaxOptions.url = "/article/delete";
    ajaxOptions.data = data;
    ajaxOptions.success = function (data) { self._crud.fire(); };
    ajaxOptions.contentType = "application/json";
    $.ajax(ajaxOptions);
};

//--- makePrivate ------------------------------------------------------------------------------
Maps.Article.prototype._makePrivate = function (self) {

    var data = {};
    data.id = self.id;

    var ajaxOptions = {};
    ajaxOptions.type = "GET";
    ajaxOptions.url = "/article/private";
    ajaxOptions.data = data;
    ajaxOptions.success = function (data) { self._madePrivate.fire(); };
    ajaxOptions.contentType = "application/json";
    $.ajax(ajaxOptions);
};

//---------------------------------------------------------------------------------
//---PaperViewModel ---------------------------------------------------------------
//---------------------------------------------------------------------------------
Maps.PaperViewModel = function () {

    var self = this;

    this.onClick = function(eventObj) { self._onClick(self, $(this), eventObj); };
    this.onSearch = function(eventObj) { self._onSearch(self, $(this), eventObj); };

    $("#search").click(self.onSearch);

    $(".lnk-button.space-left[data-mod='private']").click(self.onClick);

    $(".lnk-button.space-left[data-mod='delete']").click(function(){
        var link = $(this);
        var paperLink = link.parent().find("a").first();
        var href = paperLink.attr("href");
        var id = href.split("/")[2];
        var article = new Maps.Article(id);
        article.delete(function() {
            var widgets = new Maps.Widgets();
            var parent = link.parent();
            parent.empty();
            parent.append(widgets.alert("Article has been deleted"));
        });
    });

    $(".lnk-button.space-left[data-mod='delete']").click(function(){
        var link = $(this);
        var paperLink = link.parent().find("a").first();
        var href = paperLink.attr("href");
        var id = href.split("/")[2];
        var article = new Maps.Article(id);
        article.delete(function() {
            var widgets = new Maps.Widgets();
            var parent = link.parent();
            parent.empty();
            parent.append(widgets.alert("Article has been deleted"));
        });
    });

};

//--- onSearch ------------------------------------------------------------------------------
Maps.PaperViewModel.prototype._onSearch = function (self, caller, eventObj) {
    var text = $("#searchForArticle").val();
    $(".container .list-unstyled li").addClass("hide");
    $(".container .list-unstyled br").addClass("hide");
    $(".container .list-unstyled li").each(function() {
        var li = $(this);
        var curText = li.find("a").text();
        if (curText.toLowerCase().includes(text)) {
            li.removeClass("hide");
            li.next().removeClass("hide");
        }
    });
    //$('.container .list-unstyled li a:contains("' + text + '")').parent().removeClass("hide");
};

//--- onClick ------------------------------------------------------------------------------
Maps.PaperViewModel.prototype._onClick = function (self, caller, eventObj) {
    var link = $(this);
    var paperLink = link.parent().find("a").first();
    var href = paperLink.attr("href");
    var id = href.split("/")[2];
    var article = new Maps.Article(id);
    article.madePrivate(function() {
        var widgets = new Maps.Widgets();
        var parent = link.parent();
        parent.empty();
        parent.append(widgets.alert("Article has been made private"));
    });
    article.makePrivate();
};

//---------------------------------------------------------------------------------
//--- AddExperimentViewModel ------------------------------------------------------
//---------------------------------------------------------------------------------
Maps.AddExperimentViewModel = function () {

    var self = this;

    //this.onClick = function(eventObj) { self._onClick(self, $(this), eventObj); };
    //this.onSearch = function(eventObj) { self._onSearch(self, $(this), eventObj); };

    $('#myModal').find(".btn-primary").click(function() {
        var id_type = $('#myModal').find(".modal-body").attr("data-node");
        var split = id_type.split('_');

        var what = $('#mod_what').val();
        var whatPrev = $('#mod_what_prev').val();
        var where = $('#mod_where').val();
        var wherePrev = $('#mod_where_prev').val() || '';
        var when = $('#mod_when').val();
        var whenPrev = $('#mod_when_prev').val() || '';

        var found = $.grep(window.expList.models,function(element,index){
            
            var resultAgent = true;
            resultAgent = resultAgent && element.attributes["WhatAgent"] == whatPrev;
            resultAgent = resultAgent && element.attributes["WhenAgent"] == whenPrev;
            resultAgent = resultAgent && element.attributes["WhereAgent"] == wherePrev;

            var resultTarget = true;
            resultTarget = resultTarget && element.attributes["WhatTarget"] == whatPrev;
            resultTarget = resultTarget && element.attributes["WhenTarget"] == whenPrev;
            resultTarget = resultTarget && element.attributes["WhereTarget"] == wherePrev;
            return resultTarget || resultAgent;
        });

        var easyFound = [];
        for(var i=0; i<found.length; i++){
            var obj = {};
            obj.attributes = found[i].attributes;
            easyFound.push(obj);
        }

        var ajaxOptions = {};
        var getData = {};
        getData.id = split[0];
        getData.isAgent = split[1] == "agent";
        getData.what = what;
        getData.where = where;
        getData.when = when;
        getData.prev = {};
        getData.prev.what = whatPrev;
        getData.prev.where = wherePrev;
        getData.prev.when = whenPrev;
        getData.found = JSON.stringify(easyFound);

        getData.paper = {"uuid":window.location.href.split('/')[4]};
        ajaxOptions.type = "GET";
        ajaxOptions.data = getData;
        ajaxOptions.url = "/article/update";
        ajaxOptions.success = function (data) { location.reload(); };
        ajaxOptions.contentType = "application/json";
        $.ajax(ajaxOptions);
        $('#myModal .modal-body').empty();
        $('#myModal .modal-footer').empty();
        $('#myModal .modal-body').append('<p>Please wait while the system updates.</p>');
    });

    var svg = d3.select("svg");
    var nodes = d3.selectAll("g.node")
        .on("dblclick", function(d){

            var a = $("#btnSearch");
            var isOff = a.hasClass("btn-default");

            if (true || isOff) {
                var g = $(this);
                $('#mod_what').val(g.find("text").eq(0).text());
                $('#mod_what_prev').val(g.find("text").eq(0).text());
                $('#mod_where').val(g.find("text").eq(1).text());
                $('#mod_where_prev').val(g.find("text").eq(1).text());
                $('#mod_when').val(g.find("text").eq(2).text());
                $('#mod_when_prev').val(g.find("text").eq(2).text());
                $('#myModal').find(".modal-body").attr("data-node", g.attr("id"));
                $('#myModal').modal('show');
            }
            else {
                Maps.Hacks.queryPubmed(first, second);
            }
        });

};

//--- onSearch ------------------------------------------------------------------------------
Maps.AddExperimentViewModel.prototype._onSearch = function (self, caller, eventObj) {
    var text = $("#searchForArticle").val();
    $(".container .list-unstyled li").addClass("hide");
    $(".container .list-unstyled br").addClass("hide");
    $(".container .list-unstyled li").each(function() {
        var li = $(this);
        var curText = li.find("a").text();
        if (curText.toLowerCase().includes(text)) {
            li.removeClass("hide");
            li.next().removeClass("hide");
        }
    });

};

//--- onClick ------------------------------------------------------------------------------
Maps.AddExperimentViewModel.prototype._onClick = function (self, caller, eventObj) {
    var link = $(this);
    var paperLink = link.parent().find("a").first();
    var href = paperLink.attr("href");
    var id = href.split("/")[2];
    var article = new Maps.Article(id);
    article.madePrivate(function() {
        var widgets = new Maps.Widgets();
        var parent = link.parent();
        parent.empty();
        parent.append(widgets.alert("Article has been made private"));
    });
    article.makePrivate();
};

//---------------------------------------------------------------------------------
//--- ExperimentModalViewModel ----------------------------------------------------
//---------------------------------------------------------------------------------
Maps.ExperimentModalViewModel = function () {
    var self = this;
    $("#experiment .duplicateExp").click(function() {
        var widget = new Maps.Widgets();
        var alert = widget.alert("Experiment has been populated");
        $(".row-fluid.page-header.padTop").first().prepend(alert);
        $("[data-dismiss=modal]").trigger({ type: "click" });
    });
};

//---------------------------------------------------------------------------------
//--- EditExperimentModalViewModel ----------------------------------------------------
//---------------------------------------------------------------------------------
Maps.EditExperimentModalViewModel = function () {
    var self = this;

    this.onEmpiricalChange = function(eventObj) { self._onEmpricialChange(self, $(this), eventObj); };

    $("#empirical").change(self.onEmpiricalChange);
    $("#hypothetical").change(self.onEmpiricalChange);
};

//--- onEmpricialChange ------------------------------------------------------------------------------
Maps.EditExperimentModalViewModel.prototype._onEmpricialChange = function (self, caller, eventObj) {
    var isHypothetical = caller.is("[data-hyp]");

    if (isHypothetical){
        $("#eTargetApproach").val("HYPOTHETICAL").attr("disabled", "true");
        $("#eAgentApproach").val("HYPOTHETICAL").attr("disabled", "true");
    }
    else {
        $("#eTargetApproach").val("").removeAttr("disabled");
        $("#eAgentApproach").val("").removeAttr("disabled");
    }
};

//--- fire ------------------------------------------------------------------------------
Maps.EditExperimentModalViewModel.prototype.fire = function (uuid) {
    var expID = {
        "AgentWhat":"#eWhatagent",
        "AgentWhere":"#eWhereagent",
        "AgentWhen":"#eWhenagent",
        "AgentApproach":"#eAgentApproach",
        "TargetWhat":"#eWhattarget",
        "TargetWhen":"#eWhentarget",
        "TargetWhere":"#eWheretarget",
        "TargetApproach":"#eTargetApproach",
        "WhatSecondAgent":"#whatesecondAgent",
        "WhereSecondAgent":"#whereesecondAgent",
        "WhenSecondAgent":"#whenesecondAgent",
        "addAgentID":"#eAddAgent",
        "SecondAgentApproach":"#eSecondAgentApproach",
        "SecondManipulation":"eSecondManipulation",
        "StatTest": "#eStatTest",
        "pvalue": "#epvalue",
        "foldChange": "#efoldChange"
    };

    //if (experiment.AgentApproach == "HYPOTHETICAL" && experiment.TargetApproach == "HYPOTHETICAL") {
    //    isHypothetical = true;
    //}

    var exp = {};
    exp["WhatAgent"] = $(expID["AgentWhat"]).val().trim();
    exp["WhereAgent"] = $(expID["AgentWhere"]).val().trim();
    exp["WhenAgent"] = $(expID["AgentWhen"]).val().trim();
    exp["WhatTarget"] = $(expID["TargetWhat"]).val().trim();
    exp["WhereTarget"] = $(expID["TargetWhere"]).val().trim();
    exp["WhenTarget"] = $(expID["TargetWhen"]).val().trim();
    exp["AgentApproach"] = $(expID["AgentApproach"]).val().trim();
    exp["TargetApproach"] = $(expID["TargetApproach"]).val().trim();
    exp["WhatSecondAgent"] = $(expID["WhatSecondAgent"]).val().trim();
    exp["WhereSecondAgent"] = $(expID["WhenSecondAgent"]).val().trim();
    exp["WhenSecondAgent"] = $(expID["WhereSecondAgent"]).val().trim();
    exp["SecondAgentApproach"] = $(expID["SecondAgentApproach"]).val().trim();
    exp["Manipulation"] = '';
    exp["Result"] = '';
    exp["StatTest"] = $(expID["StatTest"]).val().trim();
    exp["pvalue"] = $(expID["pvalue"]).val().trim();
    exp["foldChange"] = $(expID["foldChange"]).val().trim();

    // Sanitize user input from “Edit Experiment” modal
    for (var field in exp) {
        if (exp.hasOwnProperty(field)) {
            exp[field] = Maps.sanitizeUserInput(exp[field]);
        }
    }

    var getRadioVal = function(key){
        $('#eExperiment').find('input:radio[name=' + key +']').each(
            function(){
                if($(this).is(':checked'))
                    exp[key] = $(this).val();
            }
        );
    };
    getRadioVal('Manipulation');
    getRadioVal('Result');
    getRadioVal('eSecondManipulation');
    if(exp["eSecondManipulation"]!=""){
        exp["SecondManipulation"] = exp["eSecondManipulation"];
        delete exp["eSecondManipulation"];
    }
    exp["uuid"] = uuid;
    var paper = {"uuid":window.location.href.split('/')[4]};
    var data = {
        "paper":paper,
        "experiment":exp
    };
    var csrf = $('#csrf').val();

    // Determine whether user is submitting a single-intervention or double-intervention experiment.
    // Count how many Result radio buttons are showing in this edit modal (3 for single, 5 for double).
    var isFormComplete = true;
    var isDoubleConnectionEdit = false;
    if (($("#eExperiment").find(".Result").find(":radio").length) === 5) {
        isDoubleConnectionEdit = true;
    }
    // Validate form fields shared by both single- and double-intervention experiments
    if (((exp["WhatAgent"] == null)      || (exp["WhatAgent"] == ""))       ||
        ((exp["WhereAgent"] == null)     || (exp["WhereAgent"] == ""))      ||
        ((exp["WhenAgent"] == null)      || (exp["WhenAgent"] == ""))       ||
        ((exp["AgentApproach"] == null)  || (exp["AgentApproach"] == ""))   ||
        ((exp["WhatTarget"] == null)     || (exp["WhatTarget"] == ""))      ||
        ((exp["WhereTarget"] == null)    || (exp["WhereTarget"] == ""))     ||
        ((exp["WhenTarget"] == null)     || (exp["WhenTarget"] == ""))      ||
        ((exp["TargetApproach"] == null) || (exp["TargetApproach"] == ""))  ||
        ((exp["Manipulation"] == null)   || (exp["Manipulation"] == ""))    ||
        ((exp["Result"] == null)         || (exp["Result"] == "")))
    {
        isFormComplete = false;
    }
    // If necessary, validate form fields specific to double-intervention experiments
    if (isDoubleConnectionEdit) {
        if (((exp["WhatSecondAgent"] == null)     || (exp["WhatSecondAgent"] == ""))     ||
            ((exp["WhereSecondAgent"] == null)    || (exp["WhereSecondAgent"] == ""))    ||
            ((exp["WhenSecondAgent"] == null)     || (exp["WhenSecondAgent"] == ""))     ||
            ((exp["SecondAgentApproach"] == null) || (exp["SecondAgentApproach"] == "")) ||
            ((exp["SecondManipulation"] == null)  || (exp["SecondManipulation"] == "")))
        {
          isFormComplete = false;
        }
    }
    // If the form is missing one or more fields, don't send an AJAX request.
    if (!isFormComplete) {
        $('#missingValuesError').removeClass('hidden');
        return;
    }
    var ajaxOptions = {};
    ajaxOptions.type = "PUT";
    ajaxOptions.url = "/experiment/" + exp["uuid"];
    ajaxOptions.data = JSON.stringify(data);
    ajaxOptions.success = function (result) {
        if(result === "Not Authorized"){
            $('#notAuthorizedError').removeClass('hidden');
        }
        else {
            location.reload(true);
        }
    };
    ajaxOptions.contentType = "application/json";
    $.ajax(ajaxOptions);
};