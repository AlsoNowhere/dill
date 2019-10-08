
import { forEach } from "../common/for-each";
import { debracer } from "../common/debracer";
import { renderAttributes } from "./render-attributes";
import { renderIf } from "./render-if";
import { renderFor } from "./render-for";
import { Options } from "../classes/options.class";

var renderTextNode = function(target, template){
	var value = target.nodeValue;
	var newValue = debracer(template.value, template.data);
	if (value === newValue) {
		return;
	}
	target.nodeValue = newValue;
}

export var renderTarget = function(target, template, condition, options){
	var name = template.name;
	var ifReturns;
	var forReturns;
	if (!(options instanceof Options)) {
		options = new Options();
	}
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
				(function(){
					var childs = options && options.parent && options.parent.childNodes;
					renderTarget(
						target === undefined
							? childs[childs.length - 1]
							: target.previousElementSibling,
						template,
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
		if (!options.noFor && template.hasOwnProperty("for")) {
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
			if (target === undefined) {
				return;
			}
			var child = target.childNodes[index];
			var output = renderTarget(
				child,
				_template,
				condition,
				child === undefined
					? new Options({parent:target})
					: undefined
			);
			index += output;
		});
	}());
	return 1;
}
