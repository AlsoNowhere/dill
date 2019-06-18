
import { forEach } from "../common/for-each";
import { debracer } from "../common/debracer";
import { renderAttributes } from "./render-attributes";
import { renderIf } from "./render-if";
import { renderFor } from "./render-for";

var renderTextNode = function(target, template){
	var value = target.nodeValue;
	var newValue = debracer(template.value, template.data);
	if (value === newValue) {
		return;
	}
	target.nodeValue = newValue;
}

// options
// an optional object that provides further commands
// {
// noIf. bool - prevents dill-if being checked. When an element is added it is rendered again. To prevent If being checked twice turn it off the second time
// }

export var renderTarget = function(target, template, condition, options){
	var name = template.name;
	var ifReturns;
	var forReturns;
	options = options || {};
	if (condition === target) {
		condition = true;
	}
	if (name === "#comment" || name === "SCRIPT") {
		return 1;
	}
	if (name === "#text") {
		if (condition === true) {
			renderTextNode(target, template);
		}
		return 1;
	}
	if (condition === true) {
		if (!options.noIf && template.hasOwnProperty("if")) {
			ifReturns = renderIf(target, template);
			if (ifReturns === "added") {
				renderTarget(target.previousElementSibling, template, condition, {noIf: true});
				return 1;
			}
			if (ifReturns === 0) {
				return ifReturns;
			}
		}
		if (template.hasOwnProperty("for")) {
			forReturns = renderFor(target, template, condition);
			if (typeof forReturns ===  "number") {
				return forReturns;
			}
		}
		renderAttributes(target, template);
	}
	(function(){
		var index = 0;
		forEach(template.children, function(_template, i){
			var output = renderTarget(target.childNodes[index], _template, condition);
			index += output;
		});
	}());
	return 1;
}
