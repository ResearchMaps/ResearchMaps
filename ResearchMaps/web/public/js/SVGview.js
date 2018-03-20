define(['jquery','Backbone','View','TableView','dust','ajax','text!../templates/experiments.dust','bootstrap'],function($,Backbone,View,TblView,dust,ajax,expTmpl){
	var SVGview = View.subclass().extend({
		initialize:function(){
			var svg = $(this.el).find('svg')[0];
			if(svg){
				svg.removeAttribute('viewBox');
				svg.setAttribute("width","100%");
				svg.setAttribute("height",document.getElementById('viewport').getBBox().height);
				var matrix = {
					"a":1,
					"b":0,
					"c":0,
					"d":1,
					"e":0, //Math.abs($(this.id).width()/2 - document.getElementById('viewport').getBBox().width/2),
					"f":document.getElementById('viewport').getBBox().height
				};
				var matrixString = "matrix(" + matrix.a + "," + matrix.b + "," + matrix.c + "," + matrix.d + "," + matrix.e + "," + matrix.f + ")";
				$(svg).find('#viewport')[0].setAttribute('transform',matrixString);
			}
		},
		events:{
			"click .edge":"highlightEdge",
			"dblclick .edge": "pubmed",
			"contextmenu .edge":"openDialog"
		},
		pubmed:function(ev){
			// var a = $("#btnSearch");
			// var isOff = a.hasClass("btn-default");
			var id = $(ev.target).parent().attr('id');
			// // if (!isOff) {
				var title = $("#" + id).find("title").text();
				var arrowSplit = title.split('->');
				var first = arrowSplit[0].split('\n')[0];
				var second = arrowSplit[1].split('\n')[0];
				Maps.Hacks.queryPubmed(first, second);
				return false;
			// }

		},
		highlightEdge:function(ev){

			var id = $(ev.target).parent().attr('id');
			// If shift key is pressed, try to highlight edge.

			if (ev.shiftKey === true) {
				var uuid = this.collection.findModel(id)[0].uuid;
				var data = {};
				data.uuid = uuid;
				var ajaxOptions = {};
				ajaxOptions.type = "POST";
				ajaxOptions.url = "/experiment/highlight";
				ajaxOptions.data = JSON.stringify(data);
				ajaxOptions.dataType = "json";
				ajaxOptions.success = function (result) {
					if (result === "Not Authorized") {
						$('#notAuthorizedError').removeClass('hidden');
					}
					else {
						location.reload(true);
					}
				};
				ajaxOptions.contentType = "application/json";
				$.ajax(ajaxOptions);
			}
			else {
				// var a = $("#btnSearch");
				// var isOff = a.hasClass("btn-default");
				// if (true || ) {//!isOff) {
				// 	var title = $("#" + id).find("title").text();
				// 	var arrowSplit = title.split('->');
				// 	var first = arrowSplit[0].split('\n')[0];
				// 	var second = arrowSplit[1].split('\n')[0];
				// 	Maps.Hacks.queryPubmed(first, second);
				// }
				// var found = this.collection.findModel(id);
				// var TableView = TblView.getClass(2);
				// if(this.tblViewObj)
				// 	this.tblViewObj.remove();
				// this.tblViewObj = new TableView({el:null,collection:{"results":found}});
				// var uuid = this.tblViewObj.collection.results[0].uuid;
				// if (Maps.has(this.tblViewObj) && Maps.has(this.tblViewObj.collection) && Maps.has(this.tblViewObj.collection.results)) {
				// 	var col = this.tblViewObj.collection.results;
				// 	for (var i=0; i<col.length; i++){
				// 		if ((!(Maps.has(col[i].Manipulation))) && (Maps.has(col[i].Experiment))) {
				// 			col[i].Manipulation = col[i].Experiment;
				// 		}
				// 	}
				// }
				// if (!Maps.has(this.tblViewObj.collection))
				// 	$('#selectExperiments').empty();
				// $('#selectExperiments').append(this.tblViewObj.render().el);
				// $('#experiment').modal('show');
				// state='';
				// Maps.Hacks.popDialog(uuid);
				// return false;

			}
		},
		openDialog:function(ev){
			// var a = $("#btnSearch");
			// var isOff = a.hasClass("btn-default");
			var id = $(ev.target).parent().attr('id');
			// // if (!isOff) {
			// 	var title = $("#" + id).find("title").text();
			// 	var arrowSplit = title.split('->');
			// 	var first = arrowSplit[0].split('\n')[0];
			// 	var second = arrowSplit[1].split('\n')[0];
			// 	Maps.Hacks.queryPubmed(first, second);
			// 	return false;
			// }

			var found = this.collection.findModel(id);
			var TableView = TblView.getClass(2);
			if(this.tblViewObj)
				this.tblViewObj.remove();
			this.tblViewObj = new TableView({el:null,collection:{"results":found}});
            var uuid = this.tblViewObj.collection.results[0].uuid;
            if (Maps.has(this.tblViewObj) && Maps.has(this.tblViewObj.collection) && Maps.has(this.tblViewObj.collection.results)) {
                var col = this.tblViewObj.collection.results;
                for (var i=0; i<col.length; i++){
                    if ((!(Maps.has(col[i].Manipulation))) && (Maps.has(col[i].Experiment))) {
                        col[i].Manipulation = col[i].Experiment;
                    }
                }
            }
            if (!Maps.has(this.tblViewObj.collection))
			$('#selectExperiments').empty();
			$('#selectExperiments').append(this.tblViewObj.render().el);
			$('#experiment').modal('show');
			state='';
            Maps.Hacks.popDialog(uuid);
			return false;
		}
	});
	return SVGview;
});