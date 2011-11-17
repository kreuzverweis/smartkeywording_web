
	var suggestions = new Array();
	var selected = new Array();
	
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
	
	function handleAjaxError(jqXHR) {
		if (jqXHR.status == 401) {
			// user unauthorized
			console.log("not authorized");
			$("div#panel").slideDown("slow");
			$("#toggle a").toggle();
			$("#userWelcome").empty().append(msg.member.notLoggedIn);
		} else {
			console.log(msg.app.problem);			
		}
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
				url: "/proposals/"+encodeURIComponent(getKeywordCSV()),
				data : {limit: 20},
				dataType: "xml",
				error: function(jqXHR, textStatus, errorThrown) {
					handleAjaxError(jqXHR);
					console.log("Proposal error text status: "+textStatus);
					console.log("Proposal error jyXHR: "+jqXHR);
					console.log("Proposal error thrown: "+errorThrown);
				},
				context: $("#suggestions"),
				beforeSend: function(xhr) {
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
		$("#member_register").attr("value", msg.member.register);
		$("#open").empty().append(msg.member.open);
		$("#close").empty().append(msg.member.close);
		
		$("#step1_label").append(msg.step1+" (<span id='examples' class='clickable' title='Simone Laudehr, Airbus A380, Cappuchino, Baum, Brooklyn Bridge, ...'>"+msg.examples+"</span>):");
		$("#step2").prepend("<span>"+msg.step2+"</span>");
		$("#step3").prepend("<span>"+msg.step3+"</span>");
		$("#copy").empty().append(msg.copy);
		$("#clear").empty().append(msg.clear);			

		login($.cookie('token'),$.cookie('secret'),
			function(token,secret) {
				console.log("authentication failed");
				handleAjaxError(this);
			},
			function(token,secret) {
				console.log("successfull login with token "+token);																	
				$("#userWelcome").empty().append(msg.member.loggedIn);
			}
		);						
				
		$("#login").click(function () {		
			login($("#token").val(),$("#secret").val(),
				function(token,secret) {					
					if (this.status == 401) { 
						// display authentication failure message						$("#login_messages").empty().append(msg.member.authenticationFailed);
					} else {
						$("#login_messages").empty().append(msg.member.authenticationError);
					}			
					$("#login_messages").effect("highlight", {}, 500);
				},
				function(token,secret) {
					$("#login_messages").empty();
					console.log("successfull login with token "+token);
					$("div#panel").slideUp("slow");
					$("#toggle a").toggle();
					$("#userWelcome").empty().append(msg.member.loggedIn);
				}
			);		
		});		
		
		$("#register").click(function () {
			$.ajax({
				type: "POST",
				url: "http://data.kreuzverweis.com/oauth/tag-credentials",
				data : {email: $("#email").val()},
				dataType: "html",
				contentType: "application/x-www-form-urlencoded",
				error: function(jqXHR, textStatus, errorThrown) {
					//TODO error handling and login popup if authentication failure
					console.log("register error text status: "+textStatus);
					console.log("register error jyXHR: "+jqXHR);
					console.log("register error thrown: "+errorThrown);
				},								
				complete: function() {
					
				},
				success: function( response ) {							
					alert(msg.member.signIn);		
				}
			});
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
			$("#suggestions > span").fadeOut(500, function () {
				$(this).remove();
				});
			$("#selected > span").fadeOut(500, function () {
				$(this).remove();
			});
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