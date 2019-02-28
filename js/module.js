"use strict";

(function(){

	var ref = window._dill;
	var Module = function(name,scope,modules){
		this.name = name;
		this.components = {};
		this.services = {};
		this.elements = {};
		modules && modules.forEach(function(x){
			var elements;
			if (typeof x === "string") {
				x = scope.modules[x];
			}
			else if (!(x instanceof Module)) {
				return;
			}
			elements = Object.keys(x.elements);
			Object.keys(x.components).forEach(function(component){
				if (x.components[component].type === "isolate") {
					return;
				}
				this.components[component] = x.components[component];
			}.bind(this));
			Object.keys(x.services).forEach(function(service){
				this.services[service] = x.services[service];
			}.bind(this));
		}.bind(this));
	}
	Module.prototype = {
		set_component: function(component){
			this.components[component.name] = component;
			if (component.type === "isolate") {
				component.module = this;
			}
		},
		set_service: function(service){
			this.services[service.name] = service.data;
			if (service.type === "isolate") {
				service.module = this;
			}
		}
	}

	window._dill.Module = Module;

	var new_module = function(){
		var Module = window._dill.Module;
		return function(name,scope,modules){
			var output = new Module(name,scope,modules);
			Object.seal(output);
			Object.freeze(output);
			return output;
		}
	}();

	window._dill.create_module = function(name,scope,modules){
		return new_module(name,scope,modules);
	}
}());
