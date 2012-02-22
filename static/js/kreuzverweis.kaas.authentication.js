function login(errorFunc, successFunc) {
	// send credentials
	$.ajax({
		url : "/completions/" + encodeURIComponent("Köln") + "?limit=1",
		dataType : "xml",
		error : function(jqXHR, textStatus, errorThrown) {
			errorFunc.call(jqXHR);
		},
		success : function(xmlResponse) {
			successFunc.call(xmlResponse);
		}
	});
}

function autoLogin(errorFunction,successFunction) {
	// check for cookies
	// if no cookies, request token/secret and set cookies
	if(!$.cookie('token') || !$.cookie('secret')) {
		// request token/secret from server
		$.ajax({
			url : "/credentials",
			type : "POST",
			data: '',
			dataType : "xml",
			error : function(jqXHR, textStatus, errorThrown) {
				errorFunction.call(jqXHR);
			},
			success : function(xmlResponse) {
				var token = $('token > id',xmlResponse).text();
				var secret = $('token > secret',xmlResponse).text();
				setCredentials(token, secret);
				console.log('token is '+$.cookie('token')+' / secret is '+$.cookie('secret'));
				// wait until cookie is set
				// try a request and check if it works
				login(errorFunction, successFunction);
			}
		});
	} else {
		login(errorFunction, successFunction);
	}	
}

function setCredentials(token, secret) {
	// set cookies
	$.cookie('token', token, {
		expires : 365
	});
	$.cookie('secret', secret, {
		expires : 365
	});
}