
"use strict";

(function(){

	window._dill.template_component = function(target,template,module){

// Check that to see if this element is actually a component on this module, if not then return undefined and do not process element as a component.
		var current_component = module.components[target.nodeName.toLowerCase()];
		if (!current_component) {
			return;
		}
		template.component = true;
		if (typeof current_component.data === "function") {
			current_component.data = new current_component.data();
		}
		template.data = this.create_data_object({
			template_object: current_component.data,
			parent_data: template.data,
			scope: target.hasAttribute("dill-scope")
				? target.attributes["dill-scope"].nodeValue
				: undefined
		});
		template.data._template = target.innerHTML;
		target.innerHTML = current_component.template;
		if (current_component.module && current_component.type !== "isolate") {
			return current_component.module;
		}
	}

}());
