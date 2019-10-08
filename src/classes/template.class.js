
import { lockObject } from "../common/lock-object";
import { createData } from "../common/create-data";
import { forEach } from "../common/for-each";
import { isSurroundedBy } from "../common/surrounded-by";

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

	var component = dillModule.components[name.toLowerCase()],
		componentIsValid = true;

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
		if (target.hasAttribute("dill-for")) {
			this.data = data;
			return;
		}

		this.data = createData(
			component.baseData,
			data,
			target.hasAttribute("dill-isolate") && "isolate"
		);

		this.data._module = component.module;
		target.removeAttribute("dill-isolate");

		forEach(target.attributes,function(attribute){
			var name = attribute.nodeName,
				value = attribute.nodeValue,
				prop;
			if (isSurroundedBy(name,"[","]")) {
				prop = name.substring(1,name.length-1);
				Object.defineProperty(this.data,prop,{
					get: function(){
						return data[value];
					},
					set: function(setValue){
						data[value] = setValue;
					}
				})
			}
			else {
				if (isSurroundedBy(value,"'")) {
					this.data[name] = value.substring(1,value.length-1);
				}
				else {
					this.data[name] = data[value];
				}
			}
		}.bind(this));

		return;
	}

	this.attributes = [];
	this.data = data;
}
