
"use strict";

(function(){

	window._dill.template_component = function(target,template,module){


// Check that to see if this element is actually a component on this module, if not then return undefined and do not process element as a component.
		var current_component = module.components[target.nodeName.toLowerCase()];
		if (!current_component) {
			return;
		}




		template.component = true;





		// if (typeof current_component.data === "object") {
		// 	template.data = this.create_data_object({
		// 		template_object:current_component.data,
		// 		parent_data:template.data,
		// 		scope:target.hasAttribute("dill-scope")
		// 			? target.attributes["dill-scope"].nodeValue
		// 			: undefined
		// 	});
		// }
		// else 
			if (typeof current_component.data === "function") {
			// template.data = new current_component.data();
			// (function(){
			// 	var _data = new current_component.data();
			// 	template.data = this.create_data_object({
			// 		template_object:_data,
			// 		parent_data:template.data,
			// 		scope:target.hasAttribute("dill-scope")
			// 			? target.attributes["dill-scope"].nodeValue
			// 			: undefined
			// 	});
			// }.apply(this));

			current_component.data = new current_component.data();



		}

		// console.log("Component 1: ", current_component, template.data);


		template.data = this.create_data_object({
			template_object:current_component.data,
			parent_data:template.data,
			scope:target.hasAttribute("dill-scope")
				? target.attributes["dill-scope"].nodeValue
				: undefined
		});


		template.data._template = target.innerHTML;
		target.innerHTML = current_component.template;

		// console.log("Component 2: ", template);




		// if (template.data.hasOwnProperty("oninit")) {
		// 	template.data.oninit();
		// }




		if (current_component.hasOwnProperty("module")) {
			return current_component.module;
		}





	}

	// window._dill.component_attributes = function(target,template){
	// 	this.for_each(target.attributes,function(attr){
	// 		var name = attr.nodeName,
	// 			value,
	// 			l,
	// 			first = name.charAt(0),
	// 			last = name.charAt(name.length-1);
	// 		if ( !( (first === "[" && last === "]") || first === ":" ) ) {
	// 			return;
	// 		}
	// 		value = attr.nodeValue;
	// 		l = value.length;
	// 		value = (value.charAt(0) === "'" && value.substr(l-1,l) === "'")
	// 			? value.substring(1,l-1) === "true"
	// 				? true
	// 				: value.substring(1,l-1) === "false"
	// 					? false
	// 					: value.substring(1,l-1)
	// 			: template.data._display[value];
	// 		name = name.substring(1,name.length-(first !== ":"));
	// 		template.data[name] = value;
	// 	});
	// }

}());
