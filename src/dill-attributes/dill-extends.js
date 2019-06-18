
import { isSurroundedBy } from "../common/surrounded-by";

export var dillExtends = function(target, template){
	var values = template.data[target.attributes["dill-extends"].nodeValue];
	target.removeAttribute("dill-extends");
	if (typeof values !== "object") {
		return;
	}
	Object.keys(values).forEach(function(key){
		var newKey = key;
		if (isSurroundedBy(key, "[", "]")) {
			newKey = ":" + key.substring(1, key.length - 1);
		}
		if (isSurroundedBy(key, "(", ")")) {
			newKey = key.substring(1, key.length - 1) + ":";
		}
		target.setAttribute(newKey, values[key]);
	});
}
