
import { forEach } from "../common/for-each";
import { createTemplate } from "../template/create-template";

export var renderIf = function(target, template){
	var data = template.data;
	var invert = template.if.invert;
	var value = template.if.value;
	var dataValue = typeof data[value] === "function"
		? data[value]()
		: data[value];
	var state = invert
		? !dataValue
		: !!dataValue;
	var initial = template.if.initial;
	var parent = template.if.parent;
	if (initial === false && state === false) {
		return 0;
	}
	if (initial === false && state === true) {
		target === undefined
			? parent.appendChild(template.if.target)
			: parent.insertBefore(template.if.target,target);
		if (template.if.first === false) {
			template.if.first = true;
			(function(){
				var newTemplate = createTemplate(template.if.target, template.data, template.data._module, template);
				template.attributes = newTemplate.attributes;
				template.children = newTemplate.children;
			}());
		}
		template.if.initial = true;
		if (template.component) {
			template.data.onadd && template.data.onadd();
		}
		return "added";
	}
	else if (initial === true && state === false) {
		parent.removeChild(template.if.target);
		if (template.component) {
			template.data.onremove && template.data.onremove();
		}
		template.if.initial = false;
		return 0;
	}
}
