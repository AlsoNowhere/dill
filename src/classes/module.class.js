
import { setComponent } from "../module/set-component";
import { lockObject } from "../common/lock-object";
import { forEach } from "../common/for-each";
import { logger } from "../common/logger.service";

export var Module = function(){
	var Module = function(name, modules){
		var currentModule = this;

		if (modules === undefined) {
			modules = [];
		}

		modules = modules.filter(function(x){
			return x instanceof Module;
		});

		this.name = name;
		this.components = {};
		this.services = {};

		forEach(modules,function(eachModule){
			if (!(eachModule instanceof Module)) {
				return;
			}

			Object.keys(eachModule.components).forEach(function(key){
				var component = eachModule.components[key];
				if (component.isIsolated) {
					return;
				}
				currentModule.components[key] = component;
			});
		});
		lockObject(this);
	};
	Module.prototype = {
		setComponent: setComponent
	};
	return Module;
}();

export var dillModule = function(name, modules){

	if (typeof name !== "string") {
        logger.error("You must pass a string as the name of the module.");
        throw new Error("You must pass a string as the name of the module.");
	}
	
	if (!!modules && !(modules instanceof Array)) {
		logger.error("You must pass an Array or undefined for the modules argument of the module.");
		throw new Error("You must pass an Array or undefined for the modules argument of the module.");
	}

	return new Module(name, modules);
}
