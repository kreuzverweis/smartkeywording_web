function login(errorFunc, successFunc) {
	// send credentials
	$.ajax({
		url : "/by-prefix/" + encodeURIComponent("Köln") + "?limit=1",
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
		//TODO: request token/secret from server
		$.ajax({
			url : "hallo",
			dataType : "xml",
			error : function(jqXHR, textStatus, errorThrown) {
				errorFunction.call(jqXHR);
			},
			success : function(xmlResponse) {
				var token;
				var secret;
				setCredentials(token, secret);
			}
		});
	}
	// try a request and check if it works
	login(errorFunction, successFunction);
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