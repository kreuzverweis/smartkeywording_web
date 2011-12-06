
	var suggestions = new Array();
	var selected = new Array();
	var complReqs = new Array();
	var propReqs = new Array();
	var loggedIn = false;
	var pause = false;
	
	jQuery.i18n.properties({
		name:'messages', 
		path:'js/', 
		mode:'both'			
	});
	
	function login(token,secret,errorFunc,successFunc) {
		// set cookies
		$.cookie('token', token, { expires: 365 });
		$.cookie('secret', secret, { expires: 365 });			
		// send credentials
		$.ajax({
				url: "/by-prefix/"+encodeURIComponent("Köln")+"?limit=1",
				dataType: "xml",
				error: function(jqXHR, textStatus, errorThrown) {
					errorFunc.call(jqXHR,token,secret);
				},
				success: function( xmlResponse ) {             
					successFunc.call(xmlResponse,token,secret);
				},
				beforeSend: function () {					
					$("#loginAction").show();
				},
				complete: function () {
					$("#loginAction").hide();
				}				
		});		
	}
	
	function handleAjaxError(jqXHR) {
		switch (jqXHR.status) {
			case 401:
				// user unauthorized
				console.log("not authorized");						
				$("#userWelcome").empty().append(msg.member.notLoggedIn);
				$("#login_messages").empty().append(msg.member.welcome);
				if ($("#toggle a:hidden").attr("id") == 'close') {
					// show panel
					$("div#panel").slideDown("slow",
						function () {
							$("#login_messages").effect("highlight", {color: "#505050"}, 500);
						}
					);
					$("#toggle a").toggle();
				} else {
					$("#login_messages").effect("highlight", {color: "#505050"}, 500);
				}
				break;
			case 500:
				// internal server error
				console.log("internal server error occurred");				
				break;
			case 0:
				// abort
				break;
			default:
				console.log("error "+jqXHR.status+" occurred: "+jqXHR.statusText);
				break;
		} 				
	}
	
	function getKeywordCSV() {
		var selectedKeywords = "";	
		for (i in selected) {
			if (selectedKeywords == "")
				selectedKeywords=selected[i];
			else
				selectedKeywords = selectedKeywords + "," + selected[i];
		}		
		return selectedKeywords;
	}			
	
	function getProposals() {	
		if (selected.length > 0) {
			$("#loadingDiv").show();		
			var url = "/proposals/"+encodeURIComponent(getKeywordCSV());
			$.ajax({
				url: url,
				data : {limit: 20},
				success: function( xmlResponse ) {						
					var newSuggestions = new Array();
					$("keyword", xmlResponse).each(function () { 	
						newSuggestions.push($("label",this).text());	
					});					
					// remove invalid ones
					$("#suggestions > span").each(function () {
						//console.log("checking "+this.text());
						var index = $.inArray($(this).text(),newSuggestions)
						//console.log("index is "+index);
						if (index > -1) {
							// remove it from newLabels and make it visible
							$(this).css("visibility","visible");
							//console.log("suggested label already exists: "+$(this).text());							
							newSuggestions.splice(index,1);							
						} else {
							// make it invisible
							//console.log("removing label that is no longer valid: "+$(this).text());
							$(this).css("visibility","hidden");
							suggestions.splice($.inArray($(this).text(),suggestions),1);
						}
					});
					// add new ones
					if (newSuggestions.length == 0) {
						console.log("no new suggestions to add");
					}
					for (l in newSuggestions) {
						// check if label already in list
						// if yes
						//console.log("adding new suggestion "+newSuggestions[l]);
						ui = createKeywordUIItem(newSuggestions[l]);						
						$(ui).appendTo($("#suggestions")).fadeIn(2000);
						suggestions.push(newSuggestions[l]);																								
					}	
					var suggs = $("#suggestions > span:first");
					if (suggs.length>0) {
						// check for empty lines and remove them
						var markedForRemoval = [];
						var currentLineTop = $(suggs[0]).offset().top;
						var removeLine = true;
						$("#suggestions > span").each(function () {						
							if ($(this).offset().top != currentLineTop) {
								// new line
								if (removeLine) {
									// last line was completely hidden
									//console.log("removing line with hidden keywords: "+markedForRemoval);
									for (i in markedForRemoval) {
										$(markedForRemoval[i]).remove();
									}
								}
								markedForRemoval = [];
								currentLineTop = $(this).offset().top;
								removeLine = true;
							}
							if ($(this).offset().top == currentLineTop) {
								// still in line
								if (removeLine) {
									if ($(this).css('visibility') == 'hidden') {
										//console.log("marking "+$(this).text()+" for removal");
										markedForRemoval.push($(this));
									} else {
										removeLine = false;
									}
								}
							} 		
						});	
					}					
				},
				error: function(jqXHR, textStatus, errorThrown) {
					handleAjaxError(jqXHR);						
				},
				complete: function() {
				if (propReqs.length == 1)
					$("#loadingDiv").hide();
				}
			});
		} else {
			console.log("not requesting proposals as no keyword is selected");
			$("#suggestions").empty();
		}
	}	
		
	function deSelect(ui) {
		if ($(ui).parent()[0] == $("#suggestions")[0]) {
				suggestions.splice($.inArray($(ui).text(),suggestions),1);
				selected.push($(ui).text());					$(ui).clone().css("display","none").appendTo($("#selected")).fadeIn(1000);
				$(ui).fadeOut(1000, function () {
						$(ui).css("display","inline");
						$(ui).css("visibility","hidden");//remove();
					}
				);					
				getProposals();
		} else if ($(ui).parent()[0] == $("#selected")[0])  {
			selected.splice($.inArray($(ui).text(),selected),1);			
			$(ui).fadeOut(1000, 
				function () {
					$(ui).remove();
				});			    
			getProposals();
		} else { //if it has been autocompleted or entered manually	
			$(ui).css("visibility","none");
			$(ui).appendTo($("#selected"));
			$(ui).fadeIn(1000);				
			selected.push($(ui).text());
			getProposals();				
			if ($("#clear").css("display")=="none") {
				$("#clear").toggle(500);
			}
		}
	}
	
	function createKeywordUIItem(label,score) {
		return $('<span>').attr({
			class: "ui-widget-content",			
			score: score}).text(label);
	}
	
	function setRecMethod() {
		var method = $.cookie("split");
		if (method == "dbp37i_noloc") {
			$("#recmethod2").attr("checked","");			
		} else { // set method to abstracts_dbp37i
			$("#recmethod1").attr("checked","true");
			$.cookie("split","abstracts_dbp37i");
		}
	}
	
	function sleep(milliseconds) {
		var start = new Date().getTime();
		while ((new Date().getTime() - start) < milliseconds){
		// Do nothing
		}
	}
	
	$(function() {			
		$("#login_messages").empty().append(msg.member.welcome);
		$("#login").attr('value',msg.button.login);
		$("#member_login").empty().append(msg.member.login);
		$("#member_userid").empty().append(msg.member.userid);
		$("#member_pwd").empty().append(msg.member.pwd);
		$("#member_recmethod").empty().append(msg.member.recmethod);
		$("#member_recmethod1").prepend(msg.member.recmethod1);
		$("#member_recmethod2").prepend(msg.member.recmethod2);
		setRecMethod();			
		$("#member_sign_up").empty().append(msg.member.sign_up);		$("#member_enter_your_email").empty().append(msg.member.enter_your_email);
		$("#member_register").attr("value", msg.member.register);
		$("#open").empty().append(msg.member.open);
		$("#close").empty().append(msg.member.close);
		
		$("#step1_label").append(msg.step1+" (<span id='examples' class='clickable' title='Simone Laudehr, Airbus A380, Kölner Dom, Baum, Brooklyn Bridge ...'>"+msg.examples+"</span>):");
		$("#step2_label").prepend(msg.step2);
		$("#step3_label").append(msg.step3);
		$("#copy").empty().append(msg.copy);
		$("#clear").empty().append(msg.clear);	
		
		$('#loginform').submit(function() {
		  return false;
		});

		login($.cookie('token'),$.cookie('secret'),
			function(token,secret) {
				console.log("authentication failed");
				handleAjaxError(this);
			},
			function(token,secret) {
				console.log("successfull login with token "+token);																	
				$("#userWelcome").empty().append(msg.member.loggedIn);
				$("#login_messages").empty().append(msg.member.loggedIn);
				$("div#panel").slideUp("slow");
				$("#toggle a").toggle();
				loggedIn = true;
			}
		);						
				
		$("#login").click(function () {		
			login($("#token").val(),$("#secret").val(),
				function(token,secret) {					
					if (this.status == 401) { 
						// display authentication failure message
						$("#login_messages").empty().append(msg.member.authenticationFailed);
					} else {
						$("#login_messages").empty().append(msg.app.problem);
					}			
					$("#login_messages").effect("highlight", {color: "#505050"}, 500);
				},
				function(token,secret) {
					$("#login_messages").empty();
					console.log("successfull login with token "+token);
					$("div#panel").slideUp("slow");
					$("#toggle a").toggle();
					$("#userWelcome").empty().append(msg.member.loggedIn);
					$("#login_messages").empty().append(msg.member.loggedIn);
					loggedIn = true;
				}
			);		
		});		
		
		$("input[name='recmethod']").click(function () {
			$.cookie('split',this.value);
		});
		
		
		$.ajaxPrefilter(function( options, originalOptions, jqXHR ) {		
			if (options.url.indexOf("/by-prefix") === 0) {
				while (complReqs.length > 0) {
					var req = complReqs.pop();
					console.log("aborting completion request "+req.options.url);
					req.jqxhr.abort();
				}
				complReqs.push({options: options,jqxhr: jqXHR});
			} 
			if (options.url.indexOf("/proposals") === 0) {
				while (propReqs.length > 0) {
					var req = propReqs.pop();
					console.log("aborting proposal request "+req.options.url);
					req.jqxhr.abort();
				}
				propReqs.push({options: options,jqxhr: jqXHR});
			} 
		});		
		
		
		$("#member_register").click(function () {
			$.ajax({
				type: "POST",
				url: "/credentials",
				data : {email: $("#email").val()},								
				error: function(jqXHR, textStatus, errorThrown) {								
					$("#login_messages").empty().append(msg.member.sign_up.error);
					$("#login_messages").effect("highlight", {color: "#505050"}, 500);
					console.log("register error text status: "+textStatus);
					console.log("register error thrown: "+errorThrown);
				},												
				success: function( response ) {							
					alert(msg.member.signIn);		
				}
			});
		});
						
		// Expand Panel
		$("#open").click(function(){
			$("div#panel").slideDown("slow");	
			$("#toggle a").toggle();
		});	
		
		// Collapse Panel
		$("#close").click(function(){
			if (loggedIn) {
				$("div#panel").slideUp("slow");	
				$("#toggle a").toggle();
			} else {
				//alert(msg.member.welcome);
				$("#login_messages").empty().append(msg.member.welcome);
				$("#login_messages").effect("highlight", {color: "#505050"}, 500);
			}
		});												
			
		$( "#suggestions" ).selectable({
			selected: function(event, ui) { 				
				deSelect(ui.selected);				
			}
		});
		
		$( "#selected" ).selectable({
			selected: function(event, ui) { 				
				deSelect(ui.selected);				
			}
		});										
		
		$("#copy").click(function(){
			window.prompt ("Press Ctrl+C (CMD+C on Mac) to copy the keywords to your clipboard.", getKeywordCSV());
    	});
    	
    	$("#clear").click(function(){
			selected = [];
			suggestions = [];
			$("#suggestions > span").fadeOut(500, function () {
				$(this).remove();
				});
			$("#suggestions").empty();
			$("#selected > span").fadeOut(500, function () {
				$(this).remove();
			});
			$("#selected").empty();
			$(this).toggle(200);
    	});

		$("#examples").tooltip();

		$("#keyword").keyup(function(eventObject) {
			if (eventObject.keyCode == 13) { // if enter has been pressed
				// if autocomplete is not open				
				if (this.value.trim()!="") {
					var ui = createKeywordUIItem(this.value,-1.0);
					deSelect(ui);					
					this.value="";					
				}
			}
		});				
		
		$( "#keyword" ).autocomplete({
			source: function( request, response ) {					
				$.ajax({					
					url: "/by-prefix/"+encodeURIComponent(request.term)+"?limit=10",
					dataType: "xml",
					error: function(jqXHR, textStatus, errorThrown) {	
						handleAjaxError(jqXHR);
					},
					complete : function () {
						$( "#keyword" ).removeClass("ui-autocomplete-loading");
					},
					success: function( xmlResponse, jqxhr ) { 		
						if (complReqs[complReqs.length-1].options.url == this.url) {							
							response($( "keyword", xmlResponse ).map(function() {
								return {
									value: $( "label", this ).text() + ( $.trim( $( "synonyms", this ).text() ) || ""),
									score: $( "score", this ).text()
								};						
							}));
						} else {
							this.abort();
						}
					 }					 
                })
            },       		
			minLength: 3,	
			autoFocus: true,
			select: function( event, dataItem ) {		
				ui = createKeywordUIItem(dataItem.item.value,dataItem.item.score);				
				deSelect(ui);
				$(this).val("");
				return false;
			},
			open: function() {
				$( this ).removeClass( "ui-corner-all" ).addClass( "ui-corner-top" );
			},
			close: function() {
				$( this ).removeClass( "ui-corner-top" ).addClass( "ui-corner-all" );
			}
		});			
	});