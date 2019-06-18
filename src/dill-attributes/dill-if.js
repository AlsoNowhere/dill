
export var dillIf = function(target, template){
	var value = target.attributes["dill-if"].nodeValue;
	var invert = value.substr(0, 1) === "!";
	if (invert) {
		value = value.substring(1, value.length);
	}
	var dataValue = typeof template.data[value] === "function"
		? template.data[value]()
		: template.data[value];
	if (invert) {
		dataValue = !dataValue;
	}
	template.if = {
		parent: target.parentNode,
		first: dataValue,
		initial: true,
		value: value,
		invert: invert,
		target: target
	};
	target.removeAttribute("dill-if");
	return dataValue;
}
