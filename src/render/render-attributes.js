
import { forEach } from "../common/for-each";
import { debracer } from "../common/debracer";

var elementProperties = ["value", "checked"];

export var renderAttributes = function(target, template){
	template.attributes && forEach(template.attributes, function(attribute){
		var type = attribute.type;
		var name = attribute.parsed || attribute.name;
		var value = debracer(attribute.value, template.data);
		var output;
		var attributeIsDefined = !!target.attributes[name];

		if (type === "bind") {
			output = typeof template.data[value] === "function"
				? template.data[value].apply(template.data)
				: template.data[value];
			if (elementProperties.indexOf(name) > -1) {
				if (target[name] === (typeof output === "number" ? output.toString() : output)) {
					return;
				}
				if (target.nodeName === "SELECT") {
					setTimeout(function(){
						target[name] = output;
					},0);
				}
				else {
					target[name] = output;
				}
				return;
			}
			if (attributeIsDefined) {
				if (target.attributes[name].nodeValue === output) {
					return;
				}
				if (output === undefined || output === false) {
					return target.removeAttribute(name);
				}
				target.attributes[name].nodeValue = output;
				return;
			}
			if (output === undefined || output === false) {
				return;
			}
			target.setAttribute(name, output);
		}
		// else if (type === "literal") {
		// 	target.setAttribute(name, value);
		// }
		else if (type === "default") {
			if (attributeIsDefined) {
				if (target.attributes[name].nodeValue === value) {
					return;
				}
				target.attributes[name].nodeValue = value;
				return;
			}
			target.setAttribute(name, value);
		}
	});
}
