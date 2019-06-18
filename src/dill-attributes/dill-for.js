
export var dillFor = function(target, template){
	var value = target.attributes["dill-for"].nodeValue;
	template.for = {
		parent: target.parentNode,
		initial: [null],
		templates: [null],
		value: value
	};
	target.removeAttribute("dill-for");
	template.for.clone = target.cloneNode(true);
	return;
}
