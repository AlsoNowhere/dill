
"use strict";

(function(){

	var Service = function(name,input,module){
		this.name = name;
		this.data = typeof input === "function"
			? (new input())
			: typeof input === "object" && !Array.isArray(input)
				? input
				: null;
		this.type = module === "isolate"
			? module
			: "normal";
		if (module instanceof ref.Module) {
			this.module = module;
		}
	}

	var ref = window._dill;

	window._dill.Service = Service;

	window._dill.generate_service = function(name,input,module){
		return new Service(name,input,module);
	};
}());
