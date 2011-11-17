
	var suggestions = new Array();
	var selected = new Array();
	var loginAttempts = 0;
	var loginFailures = 0;
	
	jQuery.i18n.properties({
		name:'messages', 
		path:'js/', 
		mode:'both'			
	});
	
	function login(token,secret,errorFunc,successFunc) {
		// set cookies
		$.cookie('token', token);
		$.cookie('secret', secret);			
		// send credentials
		$.ajax({
				url: "/by-prefix/"+encodeURIComponent("Köln")+"?limit=1",
				dataType: "xml",
				error: function(jqXHR, textStatus, errorThrown) {
					errorFunc.call(jqXHR,token,secret);
				},
				success: function( xmlResponse ) {             
					successFunc.call(xmlResponse,token,secret);
				}
		});		
	}
	
	function getKeywordCSV() {
		var selectedKeywords = "";			
		$('#selected > span').each(function(index) {
			if (selectedKeywords == "") {
				selectedKeywords = $(this).text() ;
			} else {
				selectedKeywords = selectedKeywords + "," + $(this).text(); 
			}
		});			
		return selectedKeywords;
	}
		
	function addSuggestion(label,score) {
		// check if item is already suggested or selected
		if (($.inArray(label,suggestions) == -1) && ($.inArray(label,selected) == -1)) {
			// if it is new then add it
			ui = createKeywordUIItem(label,score);
			$(ui).css("display","none");
			$(ui).appendTo($("#suggestions")).fadeIn(2000);
			suggestions.push(label);				
		} else {
			//console.log(label + " already included");
		}
	}
	
	function getProposals() {					
		$.ajax({
				url: "/proposals/"+encodeURIComponent(getKeywordCSV())+"?limit=20",
				dataType: "xml",
				error: function(jqXHR, textStatus, errorThrown) {
					//TODO error handling and login popup if authentication failure
					console.log("Proposal error text status: "+textStatus);
					console.log("Proposal error jyXHR: "+jqXHR);
					console.log("Proposal error thrown: "+errorThrown);
					return [];
				},
				context: $("#suggestions"),
				beforeSend: function() {
					$("#loadingDiv").show();
				},
				complete: function() {
					$("#loadingDiv").hide();
				},
				success: function( xmlResponse ) {							
					$( "keyword", xmlResponse ).each(function() {
						addSuggestion(
							$( "label", this ).text(),
							$( "score", this ).text());								
					});							
				}
		});
	}	
		
	function deSelect(ui) {
		if ($(ui).parent()[0] == $("#suggestions")[0]) {
				suggestions.splice($.inArray($(ui).text(),suggestions),1);
				selected.push($(ui).text());					$(ui).clone().css("display","none").appendTo($("#selected")).fadeIn(1000);
				$(ui).fadeOut(1000, function () {					
						$(ui).remove();
					}
				);					
				getProposals();
		} else if ($(ui).parent()[0] == $("#selected")[0])  {
			selected.splice($.inArray($(ui).text(),selected),1);
			addSuggestion($(ui).text(),$(ui).attr("score"));
			$(ui).fadeOut(1000, 
				function () {
					$(ui).remove();
				});			    
			getProposals();
		} else { //if it has been autocompleted or entered manually	
			$(ui).css("display","none");
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
	
	$(function() {	
		$("#member_login").empty().append(msg.member.login);
		$("#member_userid").empty().append(msg.member.userid);
		$("#member_pwd").empty().append(msg.member.pwd);
		$("#member_sign_up").empty().append(msg.member.sign_up);		$("#member_enter_your_email").empty().append(msg.member.enter_your_email);
		$("#member_register").attr({
			value: msg.member.register});
		$("#open").empty().append(msg.member.open);
		$("#close").empty().append(msg.member.close);
		
		$("#step1").prepend("<span>"+msg.step1+"</span>");
		$("#step2").prepend("<span>"+msg.step2+"</span>");
		$("#step3").prepend("<span>"+msg.step3+"</span>");
		$("#copy").empty().append(msg.copy);
		$("#clear").empty().append(msg.clear);			

		login($.cookie('token'),$.cookie('secret'),
			function(token,secret) {
				console.log("authentication failed");
				if (this.status == 404) { 
					console.log("not authorized");
					$("div#panel").slideDown("slow");
					$("#toggle a").toggle();
				} else {
					//TODO report to the user that the app cannot be run right now
				}
			},
			function(token,secret) {
				console.log("successfull login with token "+token);																	
				$("#userWelcome").empty().append(msg.member.loggedIn);
			}
		);						
				
		$("#login").click(function () {		
			login($("#token").val(),$("#secret").val(),
				function(token,secret) {
					console.log("running inside error func");
					if (this.status == 404) { 
						// display authentication failure message
						loginAttempts = loginAttempts + 1;
						if (loginAttempts == 1) {
							$("label:first").prepend(msg.member.authenticationFailed+"<br/>");
						}				
					} else {
						loginFailures = loginFailures + 1;
						if (loginFailures == 1) {
							$("label:first").prepend(msg.member.authenticationError+"<br/>");
						}
					}				
				},
				function(token,secret) {
					console.log("successfull login with token "+token);
					$("div#panel").slideUp("slow");
					$("#toggle a").toggle();
				}
			);		
		});						
						
		// Expand Panel
		$("#open").click(function(){
			$("div#panel").slideDown("slow");	
		});	
		
		// Collapse Panel
		$("#close").click(function(){
			$("div#panel").slideUp("slow");	
		});		
		
		// Switch buttons from "Log In | Register" to "Close Panel" on click
		$("#toggle a").click(function () {
			$("#toggle a").toggle();
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
			$("#suggestions > span").fadeOut(1000, function () {
				$(this).remove();
				});
			$("#selected > span").fadeOut(1000, function () {
				$(this).remove();
			});
			$(this).toggle(500);
    	});

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
						console.log("Autocomplete error text status: "+textStatus);
						console.log("Autocomplete error jyXHR: "+jqXHR);
						console.log("Autocomplete error thrown: "+errorThrown);
						return [];
					},
					success: function( xmlResponse ) {                                              
								response($( "keyword", xmlResponse ).map(function() {
									return {
										value: $( "label", this ).text() + ( $.trim( $( "synonyms", this ).text() ) || ""),
										score: $( "score", this ).text()
									};
								}));
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