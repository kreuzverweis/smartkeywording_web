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

var suggestions = new Array();
var selected = new Array();
var complReqs = new Array();
var propReqs = new Array();
var waitingForProposals = false;
var oriColor;
var $_GET = {};

function handleAjaxError(jqXHR) {
	switch (jqXHR.status) {
		case 401:
			// user unauthorized
			console.log("authentication failed, not authorized");
			// if cookies are there but have wrong data
			if($.cookie('token') && $.cookie('secret')) {
				// display authentication failure message
				var m = createMessage('error', txt_authenticationFailed_title, txt_authenticationFailed_content);
				$(m).appendTo($('#messages'));
			}
			break;
		case 500:
			// internal server error
			console.log("internal server error occurred");
			var m = createMessage('error', txt_internalServerError_title, txt_internalServerError_content);
			$(m).appendTo($('#messages'));
			break;
		case 0:
			// abort
			break;
		default:
			console.log("error " + jqXHR.status + " occurred: " + jqXHR.statusText);
			break;
	}
}

function getKeywordCSV() {
	var selectedKeywords = "";
	for(i in selected) {
		if(selectedKeywords == "")
			selectedKeywords = selected[i];
		else
			selectedKeywords = selectedKeywords + "," + selected[i];
	}
	return selectedKeywords;
}

function removeEmptyLines() {
	//console.log('hidden span.btn: ' + $("#suggestions > span.btn[style*='hidden']").length);
	var suggs = $("#suggestions > span.btn:first");
	if(suggs.length > 0) {
		// check for empty lines and remove them
		var markedForRemoval = [];
		var currentLineTop = $(suggs[0]).offset().top;
		var removeLine = true;
		var counter = 0;
		$("#suggestions > span.btn").each(function() {
			counter = counter + 1;
			if($(this).offset().top != currentLineTop) {
				// new line
				if(removeLine) {
					// last line was completely hidden
					//console.log("removing line with hidden keywords: " + markedForRemoval);
					for(i in markedForRemoval) {
						$(markedForRemoval[i]).remove();
					}
				}
				markedForRemoval = [];
				currentLineTop = $(this).offset().top;
				removeLine = true;
			}
			if($(this).offset().top == currentLineTop) {
				// still in line
				if(removeLine) {
					//console.log($(this).text() + ' hidden: ' + $(this).css('visibility'));
					if($(this).css('visibility') == 'hidden') {
						//console.log("marking " + $(this).text() + " for removal");
						markedForRemoval.push($(this));
					} else {
						removeLine = false;
					}
				}
			}
		});
		if(removeLine) {
			// last line was completely hidden
			//console.log("removing line with hidden keywords: " + markedForRemoval);
			for(i in markedForRemoval) {
				$(markedForRemoval[i]).remove();
			}
		}
	}
}

function adText() {
	var turn = 1;
	intervalID = setInterval(function(){	
		turn = turn + 1;
		if (jQuery.i18n.prop('txt_infobox_title'+turn) == '[txt_infobox_title'+turn+']')
			turn = 1;
		$('#infobox_text').fadeOut(4000);	
		$('#infobox_title').fadeOut(4000,function() {
			$('#infobox_title').empty();
			$('#infobox_text').empty();
			$('#infobox_title').append(jQuery.i18n.prop('txt_infobox_title'+turn));
			$('#infobox_text').append(jQuery.i18n.prop('txt_infobox_text'+turn));
			$('#infobox_title').fadeIn(4000);
			$('#infobox_text').fadeIn(4000);
		});
	}, 20000);	
	//$('#ad_text')
}

function getProposals(delay) {		
	if (!delay && delay!=0)
		delay = 3500;	
	delayedExec(delay, function() {						
		if(selected.length > 0) {
			waitingForProposals = true;	
			//pulsateProposals();
			$("#loadingDiv").show();
			var url = "/proposals/" + encodeURIComponent(getKeywordCSV());
			$.ajax({
				headers: { 
        			"Accept-Language": $.cookie("lang")
    			},    			
				url : url,
				data : {
					limit : 20
				},
				success : function(xmlResponse) {
					var newSuggestions = new Array();
					$("keyword", xmlResponse).each(function() {
						newSuggestions.push($("label", this).text());
					});
					// remove invalid ones
					$("#suggestions > span").each(function() {
						//console.log("checking " + $(this).text());
						var index = $.inArray($(this).text(), newSuggestions)
						//console.log("index is "+index);
						if(index > -1) {
							// remove it from newLabels and make it visible
							$(this).css("visibility", "visible");
							//console.log("suggested label already there: " + $(this).text());
							newSuggestions.splice(index, 1);
						} else {
							// make it invisible
							//console.log("hiding label that is no longer valid: " + $(this).text());
							$(this).css("visibility", "hidden");
							suggestions.splice($.inArray($(this).text(), suggestions), 1);
						}
					});
					// add new ones
					if(newSuggestions.length == 0) {
						console.log("no new suggestions to add");
					}
					for(l in newSuggestions) {
						// check if label already in list
						// if yes
						//console.log("adding new suggestion "+newSuggestions[l]);
						ui = createKeywordUIItem(newSuggestions[l]);
						$(ui).appendTo($("#suggestions")).fadeIn(2000);
						suggestions.push(newSuggestions[l]);
					}
					delayedExec(300, function() {removeEmptyLines();
					}, 'qLineRemoval');
				},
				error : function(jqXHR, textStatus, errorThrown) {
					handleAjaxError(jqXHR);
				},
				complete : function() {
					if(propReqs.length == 1) {
						$("#loadingDiv").hide();
						waitingForProposals = false;
					}					
				}
			});
		} else {
			console.log("not requesting proposals as no keyword is selected");
			clear();
		}
	}, 'qGetProposals');
}

function deSelect(ui) {
	if($(ui).parent()[0] == $("#suggestions")[0]) {
		suggestions.splice($.inArray($(ui).text(), suggestions), 1);
		selected.push($(ui).text());
		$(ui).clone().css("display", "none").addClass('primary small').appendTo($("#selected")).fadeIn(500);
		//$(ui).fadeOut(500, function() {
			$(ui).css("visibility", "hidden");
		//});
		getProposals(3500);
	} else if($(ui).parent()[0] == $("#selected")[0]) {
		selected.splice($.inArray($(ui).text(), selected), 1);
		$(ui).fadeOut(500, function() {
			$(ui).remove();
		});
		getProposals(0);
	} else {//if it has been autocompleted or entered manually
		$(ui).css("visibility", "none").addClass('primary small');
		$('#empty-suggestion-text').hide();
		$('#empty-selection-text').hide();
		$("#selected").append($(ui));
		$(ui).fadeIn(500);
		selected.push($(ui).text());
		$('#suggestions').empty();
		suggestions = [];
		getProposals(0);
		if($("#clear").css("display") == "none") {
			$("#clear").toggle(500);
		}
	}
}

function createKeywordUIItem(label, score) {
	var x = $('<span>').attr("class", "btn");
	x.attr("score", score);
	//x.css('display:inline');
	x.text(label);
	return x;
}

function setRecMethod(newMethodId) {	
	if ($_GET["split"]) {
		console.log('parameter split found, setting cookie to '+$_GET["split"]);
		$.cookie("split", 	$_GET["split"]);
	} else {
		//remove split cookie that may be left from prior webtag version to be downward compatible
	 	$.cookie("split",null);
	 	console.debug("removed potentially existing split cookie");
	}
}

/**
 * Stores and updates language setting in cookie and UI
 */
function setLanguage(newLanguage) {		
	var lang = 'en';
	// try to read previously chosen language from cookie if no newLanguage parameter is given, 
	// e.g. at startup of the app
	if (!newLanguage) {
		if ($.cookie("lang")) {
			lang = $.cookie("lang");
			newLanguage="lang_"+lang;
		} else {
			newLanguage="lang_en";
			$.cookie("lang","en");
		}
	} else {
		// update cookie to new language setting
		lang = $("#"+newLanguage).attr("value");
		$.cookie("lang",lang);
	}	
	
	// deactivate all language selectors
	$('a[id*="lang_"]').parent().attr('class', '');
	
	// highlight current language setting
	$("#" + newLanguage).parent().attr('class', 'active');
	
	jQuery.i18n.properties({
		name : 'messages',
		path : 'js/',
		mode : 'both',
		encoding : 'UTF-8',
		language : lang,
		callback : function() {
			$('#webtag_title').empty().append(webtag_title);
			$('#webtag_title_content').empty().append(webtag_title_content);
			$('#webtag_title_read_more').empty().append(webtag_title_read_more);
			
			
			$('#dropdown-language-title').empty().append(txt_dropdown_language_title);
			

			$('#subtitle').empty().append(txt_app_subtitle);

			$('#keyword').attr('placeholder', txt_input_keyword);

			$('#empty-suggestion-text > small').empty().append(txt_suggestions);
			$('#empty-selection-text > small').empty().append(txt_selection);

			$("#copy").attr('value', txt_btn_copy);
			$("#clear").attr('value', txt_btn_clear);
			
			$('#infobox_title').empty().append(txt_infobox_title1);
			$('#infobox_text').empty().append(txt_infobox_text1);
		}
	});
}


function clear() {
	selected = [];
	suggestions = [];
	$("#suggestions > span").remove();

	$("#selected > span").fadeOut(200, function() {
		$(this).remove();
	});
	$("#empty-suggestion-text").fadeIn();
	$("#empty-selection-text").fadeIn();
	$('#clear').toggle(100);
}

function default_data() {
	return $('#');
}



$(function() {

	document.location.search.replace(/\??(?:([^=]+)=([^&]*)&?)/g, function () {
	    function decode(s) {
	        return decodeURIComponent(s.split("+").join(" "));
	    }
	
	    $_GET[decode(arguments[1])] = decode(arguments[2]);
	});				
	
	autoLogin(function() {
		handleAjaxError(this);
	}, function() {
		console.log('login succeeded');
		$('#prefPanel').show();
	});	
	
	setLanguage();
	
	

	//adText();
	

	$("#input-suggestions-label").popover({
		title : function() {
			return txt_suggestions_help;
		},
		content : function() {
			return txt_suggestions_help_content;
		},
		offset : 0,
		trigger : 'hover'
	});

	$("#input-selected-label").popover({
		title : function() {
			return txt_selection_help;
		},
		content : function() {
			return txt_selection_help_content;
		},
		offset : 0,
		trigger : 'hover'
	});
	
	setRecMethod();

	$('a[id*="lang_"]').click(function() {
		console.debug($(this));
		setLanguage($(this).attr('id'));
	});

	$.ajaxPrefilter(function(options, originalOptions, jqXHR) {
		if(options.url.indexOf("/completions") === 0) {
			while(complReqs.length > 0) {
				var req = complReqs.pop();
				console.log("aborting completion request " + req.options.url);
				req.jqxhr.abort();
			}
			complReqs.push({
				options : options,
				jqxhr : jqXHR
			});
		}
		if(options.url.indexOf("/proposals") === 0) {
			while(propReqs.length > 0) {
				var req = propReqs.pop();
				console.log("aborting proposal request " + req.options.url);
				req.jqxhr.abort();
			}
			propReqs.push({
				options : options,
				jqxhr : jqXHR
			});
		}
	});

	$("#member_register").click(function() {
		$.ajax({
			type : "POST",
			url : "/credentials",
			data : {
				email : $("#email").val()
			},
			error : function(jqXHR, textStatus, errorThrown) {
				$("#login_messages").empty().append(msg.member.sign_up.error);
				$("#login_messages").effect("highlight", {
					color : "#505050"
				}, 500);
				console.log("register error text status: " + textStatus);
				console.log("register error thrown: " + errorThrown);
			},
			success : function(response) {
				alert(msg.member.signIn);
			}
		});
	});

	$("#suggestions").selectable({
		selected : function(event, ui) {
			deSelect(ui.selected);
		}
	});

	$("#selected").selectable({
		selected : function(event, ui) {
			deSelect(ui.selected);
		}
	});
	
	$("#selectionbox").mouseenter(function(){
		$("#sel_help").show();
	});
	
	$("#selectionbox").mouseleave(function(){
		$("#sel_help").hide();
	});	
	
	$("#suggestionbox").mouseenter(function(){
		$("#sugg_help").show();
	});
	
	$("#suggestionbox").mouseleave(function(){
		$("#sugg_help").hide();
	});	

	$("#copy").click(function() {
		window.prompt("Press Ctrl+C (CMD+C on Mac) to copy the keywords to your clipboard.", getKeywordCSV());
	});

	$("#clear").click(function() {
		clear();
	});

	$('#keyword').bind('keypress', function(e) {
		var code = (e.keyCode ? e.keyCode : e.which);
		// if ENTER is pressed
		 if (code == 13) { 
		 	$('#keyword').autocomplete("close");
		 	var ui = createKeywordUIItem($(this).val(), 0.0);
			deSelect(ui);
			$(this).val("");
		 }
	});


	$("#keyword").autocomplete({
		source : function(request, response) {
			$.ajax({
				headers: { 
					"Accept-Language": $.cookie("lang")        			
    			},
				url : "/completions/" + encodeURIComponent(request.term) + "?limit=10",
				dataType : "xml",
				error : function(jqXHR, textStatus, errorThrown) {
					handleAjaxError(jqXHR);
				},
				complete : function() {
					$("#keyword").removeClass("ui-autocomplete-loading");
				},
				success : function(xmlResponse, jqxhr) {
					if($('keyword', xmlResponse).length == 0) {
						console.log("no completion for "+$('#keyword').val());
						response();
					} else {
						// current input
						var input = $('#keyword').val().toLowerCase();
						var inputLength = input.length;
						var firstCompletion = $($("keyword > label",xmlResponse)[0]).text().toLowerCase();						
						if ( firstCompletion.substr(0,inputLength) == input ) {
							response($("keyword", xmlResponse).map(function() {
								return {
									value : $("label", this).text() + ($.trim($("synonyms", this).text()) || ""),
									score : $("score", this).text()
								};
							}));
						} else {
							console.log("catched belated autocomplete response");
						}
					}
				}
			})
		},
		delay : 200,
		minLength : 3,
		autoFocus : false,		
		open : function() {			
			$(this).removeClass("ui-corner-all").addClass("ui-corner-top");
		},
		close : function() {			
			$(this).removeClass("ui-corner-top").addClass("ui-corner-all");
		}
	});
});
