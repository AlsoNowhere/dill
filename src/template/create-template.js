
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

	target.attributes && target.attributes["dill-if"] && dillIf(target, template);

	target.attributes && reverseForEach(target.attributes, function(attribute){
		if (!template.if && attribute.nodeName === "dill-template") {
			return;
		}
		if (!template.if && attribute.nodeName === "dill-for") {
			return dillFor(target, template);
		}
		!template.component && template.attributes.push(new AttributeTemplate(target, template, attribute));
	});

	template.attributes && reverseForEach(template.attributes, function cleanUpAttributes(attribute, index){
		if (attribute.type === "event" || attribute.type === "hashReference") {
			template.attributes.splice(index, 1);
		}
		if (attribute.type !== "default") {
			target.removeAttribute(attribute.name);
		}
	});

	if (template.if && template.if.first === false) {
		return template;
	}

	target.attributes && target.attributes["dill-template"] && dillTemplate(target, template);

	template.component && (function(){
		var recursiveComponentElements;
		if (!(template.for ? !template.for.first : !template.for)) {
			return;
		}
		data._template = target.innerHTML;
		target.innerHTML = template.component.template;
		recursiveComponentElements = target.getElementsByTagName(template.component.name.toUpperCase());
		forEach(recursiveComponentElements,function(element){
			var hasConditional = false,
				currentElement = element;
			while (currentElement !== target && !hasConditional) {
				hasConditional = currentElement.hasAttribute("dill-if");
				currentElement = currentElement.parentNode;
			}
			if (!hasConditional) {
				throw new Error("Recursive element detected without conditional catch. To avoid infinite loop render was stopped.");
			}
		});
		if (data.hasOwnProperty("oninit")) {
			data.oninit();
		}
	}());
	
	if (template.for ? !template.for.first : !template.for) {
		target.childNodes && forEach(target.childNodes, function generateChildTemplates(child){
			template.children.push(createTemplate(child, data, dillModule, template));
		});
	}

	if (template.for) {
		template.for.first = false;
	}

	return template;
};
