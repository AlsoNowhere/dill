
import { DillTemplate } from "../classes/DillTemplate.class";
import { AttributeTemplate } from "../classes/AttributeTemplate.class";
import { forEach, reverseForEach } from "../common/for-each";
import { dillTemplate } from "../dill-attributes/dill-template";
import { dillExtends } from "../dill-attributes/dill-extends";
import { dillIf } from "../dill-attributes/dill-if";
import { dillFor } from "../dill-attributes/dill-for";
import { logger } from "../common/logger.service";

export var createDillTemplate = function(
	targetElement,
	initialDillDataModel,
	dillModule,
	templateParent
){
	var newDillTemplate = new DillTemplate(
		targetElement,
		initialDillDataModel,
		dillModule,
		templateParent
	);

	var dillDataModel = newDillTemplate.data;

	if (newDillTemplate.name === "SCRIPT" || (targetElement.hasAttribute instanceof Function && targetElement.hasAttribute("dill-ignore"))) {
		return newDillTemplate;
	}

	if (!!newDillTemplate.component && dillDataModel.hasOwnProperty("onprerender")) {
		dillDataModel.onprerender();
	}

	!!targetElement.attributes
		&& targetElement.attributes["dill-extends"]
		&& !!dillExtends
		&&  (function(){
			dillExtends(targetElement, newDillTemplate);
		}());

	!!targetElement.attributes
		&& targetElement.attributes["dill-if"]
		&& !!dillIf
		&& dillIf(targetElement, newDillTemplate);

	!!targetElement.attributes
		&& reverseForEach(targetElement.attributes, function(attribute){
			if (!newDillTemplate.if && attribute.nodeName === "dill-template") {
				return;
			}
			if (!newDillTemplate.if && attribute.nodeName === "dill-for" && !!dillFor) {
				return dillFor(targetElement, newDillTemplate);
			}
			!newDillTemplate.component
				&& newDillTemplate.attributes.push(
					new AttributeTemplate(targetElement, newDillTemplate, attribute)
				);
		});

	!!newDillTemplate.attributes
		&& reverseForEach(newDillTemplate.attributes, function cleanUpAttributes(attribute, index){
			if (attribute.type === "event" || attribute.type === "hashReference") {
				newDillTemplate.attributes.splice(index, 1);
			}
			if (attribute.type !== "default") {
				targetElement.removeAttribute(attribute.name);
			}
		});

	if (!!newDillTemplate.if && newDillTemplate.if.first === false) {
		return newDillTemplate;
	}

	targetElement.attributes
		&& targetElement.attributes["dill-template"]
		&& !!dillTemplate
		&& dillTemplate(targetElement, newDillTemplate);

	!!newDillTemplate.component && (function(){
		var recursiveComponentElements;
		if (!(newDillTemplate.for ? !newDillTemplate.for.first : !newDillTemplate.for)) {
			return;
		}
		dillDataModel._template = targetElement.innerHTML;
		targetElement.innerHTML = newDillTemplate.component.template;
		recursiveComponentElements = targetElement.getElementsByTagName(newDillTemplate.component.name.toUpperCase());
		forEach(recursiveComponentElements,function(element){
			var hasConditional = false,
				currentElement = element;
			while (currentElement !== targetElement && !hasConditional) {
				hasConditional = currentElement.hasAttribute("dill-if");
				currentElement = currentElement.parentNode;
			}
			if (!hasConditional) {
				logger.error("Recursive element detected without conditional catch. To avoid infinite loop render was stopped.");
				throw new Error("Recursive element detected without conditional catch. To avoid infinite loop render was stopped.");
			}
		});
	}());
	
	if (
		newDillTemplate.for
			? !newDillTemplate.for.first
			: !newDillTemplate.for
	) {
		targetElement.childNodes
			&& forEach(targetElement.childNodes, function generateChildTemplates(child){
				newDillTemplate.children.push(createDillTemplate(child, dillDataModel, dillModule, newDillTemplate));
			});
	}

	if (newDillTemplate.for) {
		newDillTemplate.for.first = false;
	}

	if (!!newDillTemplate.component && dillDataModel.hasOwnProperty("oninit")) {
		dillDataModel.oninit();
	}

	return newDillTemplate;
};
