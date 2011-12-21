var suggestions = new Array();
var selected = new Array();
var complReqs = new Array();
var propReqs = new Array();
var pause = false;
var acRunning = false;

var dict = {};
dict.rm_method1 = 'abstracts_dbp37i';
dict.rm_method2 = 'dbp37i_noloc';
dict.rm_combined = 'combined';
dict.abstracts_dbp37i = 'rm_method1';
dict.dbp37i_noloc = 'rm_method2';
dict.combined = 'rm_combined';

function handleAjaxError(jqXHR) {
	switch (jqXHR.status) {
		case 401:
			// user unauthorized
			console.log("authentication failed, not authorized");
			// if cookies are there but have wrong data
			if($.cookie('token') && $.cookie('secret')) {
				// display authentication failure message

			}
			break;
		case 500:
			// internal server error
			console.log("internal server error occurred");
			var m = createMessage('info', txt.internalServerError.title, txt.internalServerError.content);
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
	}
}

function getProposals() {
	if(selected.length > 0) {
		$("#loadingDiv").show();
		var url = "/proposals/" + encodeURIComponent(getKeywordCSV());
		$.ajax({
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
				}
			}
		});
	} else {
		console.log("not requesting proposals as no keyword is selected");
		clear();
	}
}

function deSelect(ui) {
	if($(ui).parent()[0] == $("#suggestions")[0]) {
		suggestions.splice($.inArray($(ui).text(), suggestions), 1);
		selected.push($(ui).text());
		$(ui).clone().css("display", "none").appendTo($("#selected")).fadeIn(500);
		//$(ui).fadeOut(500, function() {
			$(ui).css("visibility", "hidden");
		//});
		getProposals();
	} else if($(ui).parent()[0] == $("#selected")[0]) {
		selected.splice($.inArray($(ui).text(), selected), 1);
		$(ui).fadeOut(500, function() {
			$(ui).remove();
		});
		getProposals();
	} else {//if it has been autocompleted or entered manually
		$(ui).css("visibility", "none");
		$('#empty-suggestion-text').hide();
		$('#empty-selection-text').hide();
		$("#selected").append($(ui));
		$(ui).fadeIn(500);
		selected.push($(ui).text());
		getProposals();
		if($("#clear").css("display") == "none") {
			$("#clear").toggle(500);
		}
	}
}

function createKeywordUIItem(label, score) {
	var x = $('<span>').attr("class", "btn default");
	x.attr("score", score);
	//x.css('display:inline');
	x.text(label);
	return x;
}

function setRecMethod(newMethodId) {
	var method = dict[$.cookie("split")] || 'rm_random';
	if(newMethodId) {
		console.log('new rm method, setting it from ' + method + ' to ' + newMethodId);
		method = newMethodId;
		if(newMethodId == 'rm_random') {
			$.cookie('split', null);
		} else {
			$.cookie("split", dict[method], {
				expires : 365
			});
		}
	}
	$('a[id*="rm_"]').parent().attr('class', '');
	$("#" + method).parent().attr('class', 'active');
}

function sleep(milliseconds) {
	var start = new Date().getTime();
	while((new Date().getTime() - start) < milliseconds) {
		// Do nothing
	}
}

function clear() {
	selected = [];
	suggestions = [];
	$("#suggestions > span").fadeOut(500, function() {
		$(this).remove();
	});
	$("#selected > span").fadeOut(500, function() {
		$(this).remove();
	});
	$("#empty-suggestion-text").fadeIn();
	$("#empty-selection-text").fadeIn();
	$('#clear').toggle(200);
}

function default_data() {
	return $('#');
}

$(function() {
	jQuery.i18n.properties({
		name : 'messages-2',
		path : 'js/',
		mode : 'both',
		encoding : 'UTF-8',
		callback : function() {
			$('#dropdown-method-title').empty().append(txt_dropdown_method_title);
			$('#rm_random').empty().append(txt_dropdown_method_random);
			$('#rm_method1').empty().append(txt_dropdown_method_method1);
			$('#rm_method2').empty().append(txt_dropdown_method_method2);
			$('#rm_combined').empty().append(txt_dropdown_method_combined);

			$('#subtitle').empty().append(txt_app_subtitle);

			$('#keyword').attr('placeholder', txt_input_keyword);

			$('#empty-suggestion-text > small').empty().append(txt_suggestions);
			$('#empty-selection-text > small').empty().append(txt_selection);

			$("#copy").attr('value', txt_btn_copy);
			$("#clear").attr('value', txt_btn_clear);
		}
	});

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

	autoLogin(function() {
		handleAjaxError(this);
	}, function() {
		console.log('login succeeded');
		$('#prefPanel').show();
	});

	$('a[id*="rm_"]').click(function() {
		console.log($(this));
		setRecMethod($(this).attr('id'));
	});

	$.ajaxPrefilter(function(options, originalOptions, jqXHR) {
		if(options.url.indexOf("/by-prefix") === 0) {
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

	$("#copy").click(function() {
		window.prompt("Press Ctrl+C (CMD+C on Mac) to copy the keywords to your clipboard.", getKeywordCSV());
	});

	$("#clear").click(function() {
		clear();
	});

	$("#keyword").autocomplete({
		source : function(request, response) {
			$.ajax({
				url : "/by-prefix/" + encodeURIComponent(request.term) + "?limit=10",
				dataType : "xml",
				error : function(jqXHR, textStatus, errorThrown) {
					handleAjaxError(jqXHR);
				},
				complete : function() {
					$("#keyword").removeClass("ui-autocomplete-loading");
				},
				success : function(xmlResponse, jqxhr) {
					if($('keyword', xmlResponse).length == 0) {
						response([{
							value : $('#keyword').attr('value')
						}]);
					} else {
						//TODO: workaround for autocomplete bug may be to check if keywords start with current input value
						// and current completions to skip outdated response that come in late and
						// have been requested before the latest request has been responded already
						response($("keyword", xmlResponse).map(function() {
							return {
								value : $("label", this).text() + ($.trim($("synonyms", this).text()) || ""),
								score : $("score", this).text()
							};
						}));
					}

				}
			})
		},
		delay : 500,
		minLength : 3,
		autoFocus : true,
		select : function(event, dataItem) {
			ui = createKeywordUIItem(dataItem.item.value, dataItem.item.score);
			deSelect(ui);
			$(this).val("");
			return false;
		},
		open : function() {
			$(this).removeClass("ui-corner-all").addClass("ui-corner-top");
		},
		close : function() {
			ac_open = false;
			$(this).removeClass("ui-corner-top").addClass("ui-corner-all");
		}
	});
});
