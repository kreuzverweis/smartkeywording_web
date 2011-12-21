/*
 * delay: the delay to wait before the function is executed
 * theFunc: the function to be executed
 * theQueue: the name of the queue for the function calls to be executed
*/
function delayedExec(delay,theFunc,theQueue) {
	if (!window[theQueue]) {
		window[theQueue] = new Array();
	} 
		
	// abort existing timeouts	
	//console.log('queue length is: '+window[theQueue].length);
	/*
	for (i in window[theQueue]) {
		clearTimeout(window[theQueue][i]);
		//console.log('aborted 1 call');
	}
	window[theQueue] = [];
	*/
	// queue function call
	//console.log('queueing one call for '+theFunc);
	var timer=setTimeout(function (){runIfLatest(theQueue,theFunc);},delay)
	//console.log('timer is: '+timer);
	window[theQueue].push(timer);
	//queue.push(setTimeout(runIfLatest(theFunc),delay));
}

function runIfLatest(theQueue,theFunc) {
	var timer = window[theQueue].shift();
	// stop oldest one
	if (window[theQueue].length == 0) {
		//var timer = window[theQueue].shift();		
		//console.log('running function after delay, this is '+this);
		theFunc.call();
	} else {
		clearTimeout(timer);
	}
}
