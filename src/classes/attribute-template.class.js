
import { lockObject } from "../common/lock-object";
import { isSurroundedBy } from "../common/surrounded-by";

var isBinding = function(str){
	return str.substr(0, 1) === ":";
}

var isEvent = function(str){
	return str.substr(str.length - 1, 1) === ":";
}

var attributeType = function(attribute){
	var name = attribute.nodeName;
	var value = attribute.nodeValue
	if (isSurroundedBy(name, "[", "]") || isBinding(name)) {
		// if (isSurroundedBy(value, "'")) {
		// 	return "literal";
		// }
		return "bind";
	}
	if (isSurroundedBy(name, "(", ")") || isEvent(name)) {
		return "event";
	}
	return "default";
};

export var AttributeTemplate = function(target, template, attribute){
	this.name = attribute.nodeName;
	var value = attribute.nodeValue;
	if (this.name.substr(0, 1) === "#") {
		template.data[this.name.substring(1)] = target;
		this.type = "hashReference";
		return;
	}
	var parsed = isBinding(this.name)
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
	var value = this.value;
	if (this.type === "event") {
		target.addEventListener(this.parsed, function(event){
			var output = template.data[value].apply(template.data, [event, this]);
			if (output === false) {
				return;
			}
			dill.change();
		});
		return;
	}
	lockObject(this);
}
