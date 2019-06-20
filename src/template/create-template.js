
import { Template } from "../classes/template.class";
import { AttributeTemplate } from "../classes/attribute-template.class";
import { forEach, reverseForEach } from "../common/for-each";
import { dillTemplate } from "../dill-attributes/dill-template";
import { dillExtends } from "../dill-attributes/dill-extends";
import { dillIf } from "../dill-attributes/dill-if";
import { dillFor } from "../dill-attributes/dill-for";
import { createData } from "../common/create-data";

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
	template.attributes && reverseForEach(template.attributes, function cleanUpAttributes(attribute, index){
		if (attribute.type === "event" || attribute.type === "hashReference") {
			template.attributes.splice(index, 1);
		}
		if (attribute.type !== "default") {
			target.removeAttribute(attribute.name);
		}
	});
	if (template.component) {
		(function(){
			var recursiveComponentElements;
			if (template.for && !template.for.first || !template.for) {
				template.data._template = target.innerHTML;
				target.innerHTML = template.component.template;
				recursiveComponentElements = target.getElementsByTagName(template.component.name.toUpperCase());
				forEach(recursiveComponentElements,function(element){
					var hasConditional = false;
					var currentElement = element;
					while (currentElement !== target && !hasConditional) {
						hasConditional = currentElement.hasAttribute("dill-if");
						currentElement = currentElement.parentNode;
					}
					if (!hasConditional) {
						throw new Error("Recursive element detected without conditional catch. To avoid infinite loop render was stopped.");
					}
				});
				if (template.data.hasOwnProperty("oninit")) {
					template.data.oninit();
				}
			}
		}());
	}
	if (template.for && !template.for.first || !template.for) {
		target.childNodes && forEach(target.childNodes, function generateChildTemplates(child){
			template.children.push(createTemplate(child, data, dillModule, template));
		});
	}
	if (template.for) {
		template.for.first = false;
	}
	return template;
};
