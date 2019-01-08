
"use strict";

(function(){

	window._dill.render_element = function(target,template){
		var if_value;

		if (template.type === "#text") {
			target.nodeValue = this.bracer(template.value,template.data);
			return 1;
		}
		if (template.type === "#comment") {
			return 1;
		}
		
		if (template.hasOwnProperty("for")) {
			return this.render_for(target,template);
		}
		if (template.hasOwnProperty("if")) {
			if_value = this.render_if(target,template);
			if (if_value === 0) {
				return if_value;
			}
			target = if_value;
		}
		if (template.template) {
			(function(){
				var _template = template.template;
				target.innerHTML = typeof _template === "function" ? _template.apply(template.data) : _template;
				template = this.create_template(target,template.data,template.module);
				this.render_element(target,template);
				template.template = _template;
			}.apply(this));
		}
		this.render_attributes(target,template);
		// console.log("Render: ", target, template.data);
		// if (target.nodeName === "LI") {
		// 	debugger;
		// }
		(function(){
			var index = 0;
			template.childs && template.childs.forEach((function(x,i){
				index += this.render_element(target.childNodes[index],x);
			}).bind(this));
		}.apply(this));
		return 1;
	}
	
}());
