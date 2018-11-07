
"use strict";

(function(){

	var Component = function(name,data,template){
		this.name = name;
		this.data = data;
		this.template = template;
	}

	window._dill.generate_component = function(name,data,template_literal){
		this.components[name] = new Component(name,data,template_literal);
	};

}());
