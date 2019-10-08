
import { Module } from "../classes/module.class";
import { renders } from "./renders";
import { change } from "./change";
import { createTemplate } from "../template/create-template";
import { createData } from "../common/create-data";

export var render = function(target, Data, dillModule){
	if (!(dillModule instanceof Module)) {
		throw new Error("You must pass a Dill Module instance.");
	}
	if (typeof Data !== "function") {
		throw new Error("You must pass a constructor function as the original Data.");
	}
	if (!(target instanceof Element)) {
		throw new Error("You must pass a HTML element as the target.");
	}
	var data = createData(new Data(), null);
	data.oninit && data.oninit();
	data._module = dillModule;
	var template = createTemplate(target, data, dillModule);

	// console.log("Template: ", template);

	renders.push({target: target, template: template});
	change();
	return data;
}
