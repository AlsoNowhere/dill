
"use strict";

(function(){
	window._dill.for_each = function(list,callback){
		for (var i=list.length-1;i>=0;i--) {
			callback(list[i],i);
		}
	}
}());
