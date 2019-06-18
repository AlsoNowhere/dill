
import { Template } from "../classes/template.class";
import { AttributeTemplate } from "../classes/attribute-template.class";
import { forEach, reverseForEach } from "../common/for-each";
import { dillTemplate } from "../dill-attributes/dill-template";
import { dillExtends } from "../dill-attributes/dill-extends";
import { dillIf } from "../dill-attributes/dill-if";
import { dillFor } from "../dill-attributes/dill-for";

export var createTemplate = function(target, data, dillModule, templateParent){
	var template = new Template(target, data, dillModule, templateParent);
	data = template.data;
	if (template.name === "SCRIPT") {
		return template;
	}
	target.attributes && target.attributes["dill-extends"] && (function(){
		dillExtends(target, template);
	}());
	target.attributes && forEach(target.attributes, function(attribute, index){
		if (attribute.nodeName === "dill-if") {
			return dillIf(target, template);
		}
		if (attribute.nodeName === "dill-template") {
			dillTemplate(target, template);
			return;
		}
		if (attribute.nodeName === "dill-for") {
			return dillFor(target, template);
		}
		!template.component && template.attributes.push(new AttributeTemplate(target, template, attribute));
	});
	if (template.if && template.if.first === false) {
		return template;
	}
	if (template.component) {
		template.data._template = target.innerHTML;
		target.innerHTML = template.component.template;
		template.data.oninit && template.data.oninit();
	}
	template.attributes && reverseForEach(template.attributes, function(attribute, index){
		if (attribute.type === "event" || attribute.type === "hashReference") {
			template.attributes.splice(index, 1);
		}
		if (attribute.type !== "default") {
			target.removeAttribute(attribute.name);
		}
	});
	target.childNodes && forEach(target.childNodes, function(child){
		template.children.push(createTemplate(child, data, dillModule, template));
	});
	return template;
};
