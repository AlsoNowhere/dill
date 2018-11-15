
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
		if (template.hasOwnProperty("if")) {
			if_value = this.render_if(target,template);
			if (if_value === 0) {
				return if_value;
			}
		}
		if (template.hasOwnProperty("for")) {
			return this.render_for(target,template);
		}
		template.attributes && template.attributes.forEach(function(x){
			var value = this.debracer(x.value,template.data);
			target.setAttribute(x.name,value);
			if (x.name === "value") {
				setTimeout(function(){
					if (value !== undefined) {
						target.value = value;
					}
				},0);
			}
			if (!value) {
				target.removeAttribute(x.name);
			}
		}.bind(this));
		(function(){
			var index = 0;
			template.childs.forEach((function(x,i){
				index += this.render_element(target.childNodes[index],x);
			}).bind(this));
		}.apply(this));
		return 1;
	}
	
}());
