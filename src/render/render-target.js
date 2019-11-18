
import { forEach } from "../common/for-each";
import { debracer } from "../common/debracer";
import { renderAttributes } from "./render-attributes";
import { renderIf } from "./render-if";
import { renderFor } from "./render-for";
import { Options } from "../classes/Options.class";
import { DillComponent } from "../classes/DillComponent.class";

var renderTextNode = function(
	targetElement,
	dillTemplate
){
	var value = targetElement.nodeValue,
		newValue = debracer(dillTemplate.value, dillTemplate.data);

	if (value === newValue) {
		return;
	}

	targetElement.nodeValue = newValue;
}

// The condition argument is OPTIONAL and can either be a HTML element or a component constructor function.
export var renderTarget = function(
	targetElement,
	dillTemplate,
	condition,
	options
){
	var name = dillTemplate.name,
		ifReturns,
		forReturns,
		conditionIsMet = typeof condition === "boolean"
			? condition
			: false,
		makeConditionTrue = function(){
			condition = true;
			conditionIsMet = true;
		};

	if (!(options instanceof Options)) {
		options = new Options();
	}

// In order to render this element and its child nodes the condition must be -> true
// If the condition is not true then it will become true if the condition matches the element passed into the render
// OR if the current component (stored on the dill template) is the current condition.
	if (typeof condition !== "boolean") {
		if (condition instanceof Element && condition === targetElement) {
			makeConditionTrue();
		}
		else if (
			!(condition instanceof Element)
				&& condition instanceof Object
				&& dillTemplate.component instanceof DillComponent
				&& dillTemplate.component.baseData instanceof condition
		) {
			makeConditionTrue();
		}
	}

	if (name === "#comment" || name === "SCRIPT") {
		return 1;
	}

	if (name === "#text") {
		if (conditionIsMet === true) {
			renderTextNode(targetElement, dillTemplate);
		}
		return 1;
	}

	if (conditionIsMet === true) {
		if (!options.noIf && dillTemplate.hasOwnProperty("if")) {
			ifReturns = renderIf(targetElement, dillTemplate);
			if (ifReturns === "added") {
				(function(){
					var childs = options
						&& options.parent
						&& options.parent.childNodes;
					renderTarget(
						targetElement === undefined
							? childs[childs.length - 1]
							: targetElement.previousElementSibling,
						dillTemplate,
						condition,
						new Options({noIf: true})
					);
				}());
				return 1;
			}
			if (ifReturns === 0) {
				return ifReturns;
			}
		}

		if (!options.noFor && dillTemplate.hasOwnProperty("for")) {
			forReturns = renderFor(targetElement, dillTemplate, condition);
			if (typeof forReturns ===  "number") {
				return forReturns;
			}
		}

		renderAttributes(targetElement, dillTemplate);
	}

	(function(){
		var index = 0;
		forEach(dillTemplate.children, function(_template, i){
			if (targetElement === undefined) {
				return;
			}
			var child = targetElement.childNodes[index];
			var output = renderTarget(
				child,
				_template,
				condition,
				child === undefined
					? new Options({parent:targetElement})
					: undefined
			);
			index += output;
		});
	}());

	return 1;
}
