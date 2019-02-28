
"use strict";

(function(){

	window._dill.template_if = function(target,template){
		if (!target.hasAttribute("dill-if")) {
			return;
		}
		template.if = {
			element: target,
			value: target.attributes["dill-if"].nodeValue,
			initial: true,
			parent: target.parentNode,
			first: true
		}
		target.removeAttribute("dill-if");
	}

	window._dill.render_if = function(target,template){
		var if_value = this.evaluator(template.if.value,template.data);
		if (!template.if.initial && if_value) {
			target === undefined
				? template.if.parent.appendChild(template.if.element)
				: target.parentNode.insertBefore(template.if.element,target);
			target = template.if.element;
			template.if.initial = if_value;
			template.component
				&& template.data.hasOwnProperty("oninit")
				&& template.data.oninit();
		}
		else if (template.if.initial && !if_value) {
			template.if.first && (delete template.if.first);
			target.parentNode.removeChild(target);
			template.if.initial = if_value;
			!template.if.first
				&& template.component
				&& template.data.hasOwnProperty("ondestroy")
				&& template.data.ondestroy();
			return 0;
		}
		else if (!template.if.initial && !if_value) {
			return 0;
		}
		return target;
	}
	
}());
