
"use strict";

(function(){

	var Component = function(name,data,template,type,module){
		this.name = name;
		this.data = data;
		this.template = template;
// Default type is global.
// Type can be isolate which means it will not get extended to other modules.
// If type is defined as global it can have a module which will be used from there.
		this.type = type || "global";
		this.module = module;
	}

	window._dill.Component = Component;

	window._dill.generate_component = function(name,data,template_literal,type,module){
		return new Component(name,data,template_literal,type,module);
	};

}());
