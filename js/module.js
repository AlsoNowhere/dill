"use strict";

(function(){

	var ref = window._dill;
	var Module = function(name,modules){
		this.name = name;
		this.components = {};
		this.services = {};
		this.elements = {};
		modules && Object.keys(modules).forEach(function(x){
			x.components.forEach(function(component){
				this.components[component.name] = component;
			}.bind(this));
			x.services.forEach(function(service){
				this.services[service.name] = service;
			}.bind(this));
			x.elements.forEach(function(element){
				this.elements[element.name] = element;
			}.bind(this));
		}.bind(this));
	}
	Module.prototype = {
		set_component: function(name_or_component,data,template_literal){
			if (name_or_component instanceof ref.Component) {
				this.components[name_or_component.name] = name_or_component;
			}
			else {
				this.components[name_or_component] = ref.generate_component(name_or_component,data,template_literal);
			}
		},
		set_service: function(name_or_service,input){
			var service;
			if (name_or_service instanceof ref.Service) {
				this.services[name_or_service.name] = name_or_service.data;
			}
			else {
				service = ref.generate_service(name_or_service,input);
				this.services[service.name] = service.data;
			}
		},
		set_element: function(name,element){
			// console.log("Set: ", name, element, this);
			this.elements[name] = element;
		}
	}

	window._dill.Module = Module;

	var new_module = function(){
		var Module = window._dill.Module;
		return function(name,modules){
			var output = new Module(name,modules);
			Object.seal(output);
			Object.freeze(output);
			return output;
		}
	}();

	window._dill.create_module = function(name,modules){
		return new_module(name,modules);
	}
}());
