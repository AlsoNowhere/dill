
import { setComponent } from "../module/set-component";
import { setService } from "../module/set-service";
import { lockObject } from "../common/lock-object";
import { forEach } from "../common/for-each";

export var Module = function(){
	var Module = function(name, modules){
		var _module = this;
		if (modules === undefined) {
			modules = [];
		}
		this.components = {};
		this.services = {};
		this.name = name;
		forEach(modules,function(eachModule){
			if (!(eachModule instanceof Module)) {
				return;
			}
			Object.keys(eachModule.components).forEach(function(key){
				var component = eachModule.components[key];
				if (component.isIsolated) {
					return;
				}
				_module.components[key] = component;
			});
			Object.keys(eachModule.services).forEach(function(key){
				var service = eachModule.services[key];
				if (service.isIsolated) {
					return;
				}
				_module.services[key] = service;
			});
		});
		lockObject(this);
	};
	Module.prototype = {
		setComponent: setComponent,
		setService: setService
	};
	return Module;
}();
