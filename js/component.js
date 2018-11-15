
"use strict";

(function(){

	var Component = function(name,data,template){
		this.name = name;
		this.data = data;
		this.template = template;
	}

	window._dill.Component = Component;

	window._dill.generate_component = function(name,data,template_literal){
		return new Component(name,data,template_literal);
	};

}());
