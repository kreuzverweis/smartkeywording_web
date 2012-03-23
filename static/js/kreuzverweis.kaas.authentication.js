/**

 Copyright 2012 Kreuzverweis Solutions GmbH

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.

 **/

function autoLogin(errorFunction, successFunction) {
	// if no token is available
	if(!$.cookie('token')) {
		// if no userid is available
		if(!$.cookie('userid')) {
			// create user and store userid in cookie
			$.ajax({
				url : "/users",
				type : "POST",
				data : '',
				async: false,
				dataType : "xml",
				error : function(jqXHR, textStatus, errorThrown) {
					errorFunction.call(jqXHR);
				},
				success : function(xmlResponse) {
					var userid = $('user > id', xmlResponse).text();
					$.cookie('userid', userid, {
						expires : 365
					});
					console.log('userid is ' + $.cookie('userid'));
					// try a request and check if it works
				}
			});
		}
		var userid = $.cookie('userid');
		$.ajax({
			url : "/users/" + userid + "/tokens",
			type : "POST",
			data : '',
			async: false,
			dataType : "xml",
			error : function(jqXHR, textStatus, errorThrown) {
				errorFunction.call(jqXHR);
			},
			success : function(xmlResponse) {
				var token = $('token > value', xmlResponse).text();
				//var expires = $('token > expires', xmlResponse).text();
				$.cookie('token', token);
				console.log('token is ' + $.cookie('token'));
			}
		});
	}
	// try a request and check if it works
	login(errorFunction, successFunction);
}

function login(errorFunc, successFunc) {
	// send credentials
	$.ajax({
		url : "/completions/" + encodeURIComponent("Köln") + "?limit=1",
		dataType : "xml",
		async: false,
		error : function(jqXHR, textStatus, errorThrown) {
			errorFunc.call(jqXHR);
		},
		success : function(xmlResponse) {
			successFunc.call(xmlResponse);
		}
	});
}