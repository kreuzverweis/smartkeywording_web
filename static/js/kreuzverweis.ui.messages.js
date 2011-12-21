
function createMessage(type,title,content) {
	var newDiv = $('<div>')
			.attr('class', "alert-message "+type+" fade in")
			.attr('data-alert', "alert");
	var closeButton = $('<a>')
			.attr("class", "close")
			.attr("href:","#")
			.text('x');
	$(newDiv)
		.append(closeButton)
		.append($('<strong>').text(title+' '))
		.append(content);
	return $(newDiv);
}