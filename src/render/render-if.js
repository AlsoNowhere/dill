
import { forEach } from "../common/for-each";
import { recurseComponent } from "../common/recurse-component";
import { createTemplate } from "../template/create-template";
import { dillTemplate } from "../dill-attributes/dill-template";

// var recurseComponent = function(template,type){
// 	if (template.component.hasOwnProperty(type) && typeof template.component[type] === "function") {
// 		template.component[type]();
// 	}
// 	forEach(template.childs,function(x){
// 		recurseComponent(x,type);
// 	});
// }

export var renderIf = function(target, template){
	var data = template.data;
	var invert = template.if.invert;
	var value = template.if.value;
	var dataValue = typeof data[value] === "function"
		? data[value]()
		: data[value];
	var oldState = template.if.initial;
	var newState = invert
		? !dataValue
		: !!dataValue;
	var parent = template.if.parent;
	if (oldState === false && newState === false) {
		return 0;
	}
	if (oldState === false && newState === true) {
		target === undefined
			? parent.appendChild(template.if.target)
			: parent.insertBefore(template.if.target,target);
		if (template.if.first === false) {
			template.if.first = true;
			(function(){
				// var newTemplate = createTemplate(template.if.target, template.data, template.data._module, template);
				// template.attributes = newTemplate.attributes;
				// template.children = newTemplate.children;








				template.if.target.attributes
					&& template.if.target.attributes["dill-template"]
					&& dillTemplate(template.if.target, template);

				if (template.component) {
					(function(){
						var recursiveComponentElements;
						// if (template.for && !template.for.first || !template.for) {
							template.data._template = template.if.target.innerHTML;
							template.if.target.innerHTML = template.component.template;
							recursiveComponentElements = template.if.target.getElementsByTagName(template.component.name.toUpperCase());
							forEach(recursiveComponentElements,function(element){
								var hasConditional = false,
									currentElement = element;
								while (currentElement !== template.if.target && !hasConditional) {
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
						// }
					}());
				}
				// if (template.for && !template.for.first || !template.for) {
					template.if.target.childNodes && forEach(template.if.target.childNodes, function generateChildTemplates(child){
						template.children.push(createTemplate(child, template.data, template.data._module, template));
					});
				// }

























			}());
		}
		else {
			// console.log("New init: ", template);
			recurseComponent(template,"oninit");
		}
		template.if.initial = true;
		// if (template.component) {
		// 	template.data.onadd && template.data.onadd();
		// }


		return "added";
	}
	else if (oldState === true && newState === false) {
		parent.removeChild(template.if.target);
		// if (template.component) {
		// 	template.data.onremove && template.data.onremove();
		// }

		recurseComponent(template,"onremove");

		template.if.initial = false;
		return 0;
	}
}
