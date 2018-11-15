"use strict";

(function(){
	window._dill.dill_template = function(target,data){
		var _template,
			value;
		if (target.hasAttribute("dill-template")) {
			_template = target.innerHTML;
			value = data[target.attributes["dill-template"].nodeValue];
			value = typeof value === "function" ? value.apply(data) : value;
			if (value !== false) {
				target.innerHTML = value;
			}
			data._template = _template;
		}
	}
}());
