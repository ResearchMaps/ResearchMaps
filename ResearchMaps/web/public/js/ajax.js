define(['jquery'],function($){
	var makeRequest = function(url,method,data,csrf,callback){
        prepareHeader(csrf);
        $.ajax({
            url: url,
            type: method,
            data: data,
            success: callback
        });
    };
    var prepareHeader = function(csrf){
        var csrfSafeMethod = function(method) {
            return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
        };
        $.ajaxSetup({
            crossDomain: false, // obviates need for sameOrigin test
            beforeSend: function(xhr, settings) {
                if (!csrfSafeMethod(settings.type)) {
                    xhr.setRequestHeader("X-CSRF-Token", csrf);
                }
                else
                    console.log("CSRF Safe");
            }
        });
    };
    return {
        makeRequest:makeRequest,
    	prepareHeader:prepareHeader
    }
})