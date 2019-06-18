
import { Component } from "../components/component.class";

export var setComponent = function(component){
	if (!(component instanceof Component)) {
		throw new Error("You can only set an instance of Dill Component as a component");
	}
	this.components[component.name] = component;
	this.components[component.name].setModule(this);
};
