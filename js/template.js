"use strict";

(function(){
	window._dill.dill_template = function(target,template){
		var _template,
			value;
		if (target.hasAttribute("dill-template")) {
			value = template.data[target.attributes["dill-template"].nodeValue];
			template.template = value;
			target.removeAttribute("dill-template");
		}
	}
}());
