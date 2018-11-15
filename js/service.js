
"use strict";

(function(){

	var Service = function(name,input){
		this.name = name;
		this.data = typeof input === "function"
			? (new input())
			: typeof input === "object" && !Array.isArray(input)
				? input
				: null
	}

	window._dill.Service = Service;

	window._dill.generate_service = function(name,input){
		return new Service(name,input);
	};
}());
