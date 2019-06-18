
import { lockObject } from "../common/lock-object";
import { error } from "../common/error";
import { Module } from "../classes/module.class";

export var Component = function(name, data, template, isolateState, abstractConditions){
	if (name === "undefined" || name === "") {
		error("You must pass a name to create a Component (!name, data object, HTML template)");
	}
	var _module = null;
	this.name = name;
	this.baseData = data === undefined
		? {}
		: typeof data === "function"
			? new data()
			: typeof data === "object"
				? data
				: error("You must pass an object or constructor function to create a Component (name, !data object, HTML template)");
	this.template = template || "";
	this.isIsolated = isolateState === "isolate";
	Object.defineProperty(this,"module",{
		get: function(){
			return _module;
		}
	});
	this.setModule = function(newModule){
		if (_module !== null || !(newModule instanceof Module)) {
			return;
		}
		_module = newModule;
	}
	if (abstractConditions) {
		this.abstractConditions = abstractConditions;
	}
	lockObject(this);
}
