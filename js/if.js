
"use strict";

(function(){

	window._dill.template_if = function(target,template){
		if (target.hasAttribute("dill-if")) {
			template.if = {
				element: target,
				value: target.attributes["dill-if"].nodeValue,
				initial: true,
				parent: target.parentNode
			}
		}
	}

	window._dill.render_if = function(target,template){
		var if_value = this.debracer(template.if.value,template.data);
		// console.log("Value if: ", if_value, template.if.initial);
		if (!template.if.initial && if_value) {
			if (target === undefined) {
				template.if.parent.appendChild(template.if.element);
			}
			else {
				target.parentNode.insertBefore(template.if.element,target);
			}
			target = template.if.element;
			template.if.initial = if_value;
		}
		else if (template.if.initial && !if_value) {
			target.parentNode.removeChild(target);
			template.if.initial = if_value;
			return 0;
		}
		else if (!template.if.initial && !if_value) {
			return 0;
		}
		return target;
	}
	
}());
