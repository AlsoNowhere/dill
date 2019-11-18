
import { lockObject } from "../common/lock-object";
import { createData } from "../common/create-data";
import { forEach } from "../common/for-each";
import { isSurroundedBy } from "../common/surrounded-by";
import { DillComponent } from "./DillComponent.class";

export var DillTemplate = function(
	targetElement,
	initialDillDataModel,
	dillModule,
	templateParent
){
	this.name = targetElement.nodeName;
	this.module = dillModule;

	if (!!templateParent) {
		this.templateParent = templateParent;
	}

	if (this.name === "#text") {
		this.value = targetElement.nodeValue;
		this.data = initialDillDataModel;
		return lockObject(this);
	}

	this.children = [];

	var component = dillModule.components[this.name.toLowerCase()],
		componentIsValid = true;

	if (!!component) {
		component = new DillComponent(component);
	}

	// console.log("Component: ", component);

	// var checkParentTemplates = function(parent,condition){
	// 	if (!parent.templateParent) {
	// 		return;
	// 	}
	// 	if (parent.component === condition) {
	// 		componentIsValid = true;
	// 		return;
	// 	}
	// 	checkParentTemplates(parent.templateParent,condition);
	// }

	// if (!!component && !!component.abstractConditions) {
	// 	componentIsValid = false;
	// 	forEach(component.abstractConditions,function(condition){
	// 		if (componentIsValid) {
	// 			return false;
	// 		}
	// 		checkParentTemplates(this,condition);
	// 	}.bind(this));
	// }

	if (component !== undefined && componentIsValid) {
		this.component = component;
		if (targetElement.hasAttribute("dill-for")) {
			this.data = initialDillDataModel;
			return;
		}

		this.data = createData(
			component.baseData,
			initialDillDataModel,
			!!targetElement.hasAttribute("dill-isolate")
		);

		targetElement.removeAttribute("dill-isolate");

		forEach(targetElement.attributes,function(attribute){
			var name = attribute.nodeName,
				value = attribute.nodeValue,
				prop;
			if (isSurroundedBy(name,"[","]")) {
				prop = name.substring(1,name.length-1);
				Object.defineProperty(this.data,prop,{
					get: function(){
						return initialDillDataModel[value];
					},
					set: function(setValue){
						initialDillDataModel[value] = setValue;
					}
				});
			}
			else {
				this.data[name] = isSurroundedBy(value,"'")
					? value.substring(1,value.length-1)
					: initialDillDataModel[value];
			}
		}.bind(this));

		return;
	}

	this.attributes = [];
	this.data = initialDillDataModel;
}
