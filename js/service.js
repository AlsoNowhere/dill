
"use strict";

(function(){
	window._dill.generate_service = function(name,input){
		dill.services[name] = typeof input === "function"
			? (new input())
			: input;
	};
}());
