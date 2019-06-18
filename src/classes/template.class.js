
import { lockObject } from "../common/lock-object";
import { createData } from "../common/create-data";
import { forEach } from "../common/for-each";

export var Template = function(target, data, dillModule, templateParent){
	var name = target.nodeName;
	this.name = target.nodeName;
	this.module = dillModule;
	if (templateParent) {
		this.templateParent = templateParent;
	}
	if (this.name === "#text") {
		this.value = target.nodeValue;
		this.data = data;
		lockObject(this);
		return this;
	}
	this.children = [];
	var checkParentTemplates = function(parent,condition){
		if (!parent.templateParent) {
			return;
		}
		if (parent.component === condition) {
			componentIsValid = true;
			return;
		}
		checkParentTemplates(parent.templateParent,condition);
	}
	var component = dillModule.components[name.toLowerCase()];
	var componentIsValid = true;

	if (component && component.abstractConditions) {
		componentIsValid = false;
		forEach(component.abstractConditions,function(condition){
			if (componentIsValid) {
				return false;
			}
			checkParentTemplates(this,condition);
		}.bind(this));
	}
	if (component !== undefined && componentIsValid) {
		this.component = component;
		this.data = createData(
			component.baseData,
			data,
			target.hasAttribute("dill-isolate")
				? "isolate"
				: undefined
		);
		this.data._module = component.module;
		target.removeAttribute("dill-isolate");
		forEach(target.attributes,function(attribute){
			var name = attribute.nodeName;
			var value = attribute.nodeValue;
			this.data[name] = data[value];
		}.bind(this));
		return;
	}

	this.attributes = [];
	this.data = data;
}
