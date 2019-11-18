
import { lockObject } from "../common/lock-object";
import { isSurroundedBy } from "../common/surrounded-by";
import { logger } from "../common/logger.service";

var isBinding = function(str){
	return str.substr(0, 1) === ":";
}

var isEvent = function(str){
	return str.substr(str.length - 1, 1) === ":";
}

var attributeType = function(attribute){
	var name = attribute.nodeName;
	if (isSurroundedBy(name, "[", "]") || isBinding(name)) {
		return "bind";
	}
	if (isSurroundedBy(name, "(", ")") || isEvent(name)) {
		return "event";
	}
	return "default";
};

export var AttributeTemplate = function(
	target,
	template,
	attribute
){

	this.name = attribute.nodeName;
	var value = attribute.nodeValue,
		parsed;

	if (this.name.substr(0, 1) === "#") {
// This is a set to and not an Object.defineProperty because it is up to the user to define a property where they deem is appropriate.
// If the user defines the property it will be a getter setter, if they do not it will be a static property and will stay at the scope level.
		template.data[this.name.substring(1)] = target;
		this.type = "hashReference";
		return;
	}

	parsed = isBinding(this.name)
		? this.name.substring(1, this.name.length)
		: isEvent(this.name)
			? this.name.substring(0, this.name.length - 1)
			: this.name.substring(1,this.name.length-1);

	this.type = attributeType(attribute);
	this.value = this.type === "literal"
		? value.substring(1,value.length-1)
		: value;

	if (this.type !== "default") {
		this.parsed = parsed;
	}

	value = this.value;

	if (this.type === "event") {

		var eventProperty = template.data[value];

		if (!(eventProperty instanceof Function)) {
			logger.warn("Event " + this.parsed + " property is not a function, nothing will be run.");
		}

		target.addEventListener(this.parsed, function(event){
			if (eventProperty === undefined) {
				return;
			}
			var output = eventProperty.apply(template.data, [event, this]);
			output !== false && dill.change();
		});
		return;
	}

	lockObject(this);
}
