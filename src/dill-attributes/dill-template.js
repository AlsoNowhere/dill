
export var dillTemplate = function(target, template){
	var value = target.attributes["dill-template"].nodeValue;
	var data = template.data[value];
	target.innerHTML = typeof data === "function"
		? data.apply(template.data)
		: data;
	target.removeAttribute("dill-template");
}
