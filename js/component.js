
"use strict";

(function(){

	var Component = function(name,data,template,module){
		this.name = name;
		this.data = data;
		this.template = template;
// Default type is global.
// Type can be isolate which means it will not get extended to other modules.
// If type is defined as global it can have a module which will be used from there.

		this.type = module === "isolate"
			? module
			: "normal";
		if (module instanceof ref.Module) {
			this.module = module;
		}
	}

	var ref = window._dill;

	window._dill.Component = Component;

	window._dill.generate_component = function(name,data,template_literal,module){
		return new Component(name,data,template_literal,module);
	};

}());
