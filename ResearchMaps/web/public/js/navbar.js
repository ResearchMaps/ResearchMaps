define(['jquery','autocomplete','ajax','text!../templates/pubmedArticle.dust',
	"javascript","elixir","scroll_to_top",
	"icon_checkmark","mobile_toggle_icon_arrow_2","banner1",
	"ec_one_bkg1","sidebar_hidden","bootstrap"],function($,autocomplete,ajax,pubmedTmpl){
	//Javascript for navbar
	var init = function(){
		
		$("[data-hide]").click(function(){
			$(this).parent().addClass('hidden');
		});

		var displayError = function(errorText){
			$('#error > .errorText').empty();
			$('#error > .errorText').append(errorText);
			$('#error').removeClass("hidden");
		};

		//PubMed autocomplete functionality for Enter Map modal
		autocomplete.suggestions(pubmedTmpl,'pubmed','pubmed','#pubmed','/autocomplete?term=%QUERY','title',
			function(parsedResponse){
				if(parsedResponse === "No results found"){
					displayError(parsedResponse);
					return [];
				}
				var resultArray = [];
				parsedResponse.forEach(function(element){
					var arr = [];
					var journal = element["journal"] + " " + element["pubDate"] + " " + element["issue"] + element["volume"];
					var authors = "";
					for (var i = 0; i < element["authors"].length; i++) {
						authors += element["authors"][i] + ","
					};
					authors = authors.substring(0,authors.length-1);
					resultArray.push({
						journal:journal,
						title:element["title"],
						authors:authors,
						PMID:element["PMID"]
					});
				});
				return resultArray;
			}
		);

		//Ajax call to add paper.
		var createPaper = function(data,isPrivate){
			data["isPrivate"] = isPrivate;
			var csrf = $('#csrf').val();
			ajax.makeRequest("/paper","POST",data,csrf,function(result){
				if(result["error"]){
					if(result["error"] === "Already Exists"){
						displayError("Another user already entered the paper. " +
									"Click <a href='" + result["uri"] + "'>here</a> to access the paper");
					}
				}
				else
					window.location.href = result["uri"];
			});
		};
		$('#pubmed').bind('typeahead:selected', function(obj, datum, name) {
			createPaper(datum,false);
		});
		$('#privateSubmit').click(function(){
			var data = {};
			data["title"] = $('#privateTitle').val();
			data["authors"] = $('#privateAuthors').val();
			createPaper(data,true);
		});

		//Change Passwords
		$('#updatePasswordBtn').click(function(){
			var oldPassword = $('#oldPassword').val();
			var newPassword = $('#newPassword').val();
			var confirmNewPassword = $('#confirmNew').val();
			if(!oldPassword || !newPassword || !newPassword){
				$('#passwordErrorText').empty();
				$('#passwordErrorText').append('There are some missing values in this form. Please enter all values before clicking Submit.');
				$('#passwordError').removeClass('hidden');
				return;
			}
			if(newPassword !== confirmNewPassword){
				$('#passwordErrorText').empty();
				$('#passwordErrorText').append('New password and confirm new password don\'t match');
				$('#passwordError').removeClass('hidden');
				return;
			}
			var data = {
				"oldPassword":oldPassword,
				"newPassword":newPassword
			};
			var csrf = $('#csrf').val();
			ajax.makeRequest("/user","PUT",data,csrf,function(result){

            var widget = new Maps.Widgets();
            $("body").prepend(widget.alert("Password has been changed"));

                var options = {};
                options.backdrop = false;
                options.show = false;
                $('#updatePassword').modal(options);
                $('#updatePassword').modal("toggle");
                $('#updatePassword').data('bs.modal', null);
            });
		});
	};
	return {
		initialize:init
	};
})