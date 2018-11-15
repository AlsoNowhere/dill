
"use strict";

(function(){

	window._dill.template_component = function(target,template,module){
		var current_component = module.components[target.nodeName.toLowerCase()];
		if (!current_component) {
			return false;
		}
		target.innerHTML = current_component.template;
		if (typeof current_component.data === "object") {
			template.data = this.create_data_object({
				template_object:current_component.data,
				parent_data:template.data,
				scope:target.hasAttribute("dill-scope")
					? target.attributes["dill-scope"].nodeValue
					: undefined
			});
		}
		else if (typeof current_component.data === "function") {
			template.data = new current_component.data();
		}
		if (template.data.hasOwnProperty("oninit")) {
			template.data.oninit();
		}
		return true;
	}

	window._dill.component_attributes = function(target,template){
		this.for_each(target.attributes,function(attr){
			var name = attr.nodeName,
				value,
				l,
				first = name.substr(0,1),
				last = name.substr(name.length-1,1);
			if ( !( (first === "[" && last === "]") || first === ":" ) ) {
				return;
			}
			value = attr.nodeValue;
			l = value.length;
			value = (value.substr(0,1) === "'" && value.substr(l-1,l) === "'")
				? value.substring(1,l-1) === "true"
					? true
					: value.substring(1,l-1) === "false"
						? false
						: value.substring(1,l-1)
				: template.data._display[value];
			name = name.substring(1,name.length-(first !== ":"));
			template.data[name] = value;
		});
	}

}());
