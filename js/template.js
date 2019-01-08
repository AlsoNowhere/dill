"use strict";

(function(){
	window._dill.dill_template = function(target,template){
		var _template,
			value;
		if (target.hasAttribute("dill-template")) {


			// console.log("Template: ", target, template.data);

			// _template = target.innerHTML;
			value = template.data[target.attributes["dill-template"].nodeValue];
			// value = typeof value === "function" ? value.apply(template.data) : value;
			// if (value !== false) {
			// 	target.innerHTML = value;
			// }
			// template.data._template = _template;
			template.template = value;
			target.removeAttribute("dill-template");



		}
	}
}());
