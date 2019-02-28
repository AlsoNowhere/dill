
"use strict";

(function(){

	window._dill.render_element = function(target,template,parent){
		var if_value;

		if (template.type === "#text") {
			target.nodeValue = this.bracer(template.value,template.data);
			return 1;
		}
		if (template.type === "#comment") {
			return 1;
		}
		
		if (template.hasOwnProperty("for")) {
			return this.render_for(target,template,parent);
		}
		if (template.hasOwnProperty("if")) {
			if_value = this.render_if(target,template);
			if (if_value === 0) {
				return 0;
			}
			target = if_value;
		}
		if (template.template) {
			(function(){
				var _template = template.template;
				var attributes = template.attributes;
				target.innerHTML = typeof _template === "function"
					? _template.apply(template.data)
					: _template;
				template = this.create_template(target,template.data,template.module);
			// Recreating the template will generate the wrong attributes Array. We save it from its original and place it back in here:
				template.attributes = attributes;
				this.render_element(target,template);
				template.template = _template;
			}.apply(this));
		}
		this.render_attributes(target,template);
		if (template.component) {
			template.data.onchange && template.data.onchange();
		}
		(function(){
			var index = 0;
			template.childs && template.childs.forEach((function(x,i){
				index += this.render_element(target.childNodes[index],x,template);
			}).bind(this));
		}.apply(this));
		return 1;
	}
	
}());
