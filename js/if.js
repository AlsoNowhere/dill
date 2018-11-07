
"use strict";

(function(){

	window._dill.render_if = function(target,data,template){
		var value = typeof data[template.if.value] === "function"
			? data[template.if.value]()
			: data[template.if.value];
		if (template.if.initial && !value) {
			target.parentNode.removeChild(target);
			template.if.initial = value;
			return 0;
		}
		if (!template.if.initial && !value) {
			return 0;
		}
		else if (!template.if.initial && value) {
			target.parentNode.insertBefore(template.if.clone,target);
			target = target.previousSibling;
			template.if.initial = value;
			return target;
		}
		return target;
	}
	
}());
