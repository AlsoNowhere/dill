
import { Component } from "./component.class";

export var createComponent = function(name, data, template, isolateState, abstractConditions){
	return new Component(name, data, template, isolateState, abstractConditions);
}
