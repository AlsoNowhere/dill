
"use strict";

(function(){

	window._dill.render_element = function(input){
		var target = input.ele,
			template = input.template,
			data = input.data,
			parent = input.parent,
			_if;
		if (template.type === "#text") {
			target.nodeValue = this.bracer(template.value,data);
			return 1;
		}
		if (template.type === "#comment") {
			return 1;
		}
		if (template.hasOwnProperty("if")) {
			_if = this.render_if(target,data,template);
			if (_if === 0) {
				return _if;
			}
			target = _if;
		}
		if (template.hasOwnProperty("for")) {
			return this.render_for(target,data,template,parent);
		}
		if (target.hasAttribute("dill-template")) {
			data._template = target.innerHTML;
			target.innerHTML = typeof data[target.attributes["dill-template"].nodeValue] === "function"
				? data[target.attributes["dill-template"].nodeValue]()
				: data[target.attributes["dill-template"].nodeValue];
			template = this.create_template(target,data);
		}
		if (dill.components[target.nodeName.toLowerCase()]) {
			data = this.create_data_object(dill.components[target.nodeName.toLowerCase()].data,data);
			this.map_component_attributes(target,data);
			if (data.hasOwnProperty("oninit") && typeof data.oninit === "function") {
				data.oninit();
			}
		}
		template.attributes.forEach(function(x){
			var value = typeof data[x.value] === "function"
				? data[x.value]()
				: data[x.value];
			target.setAttribute(x.name,value === undefined ? "" : value);
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
		});
		this.for_each(target.attributes,function(attr){
			if (attr.nodeName.substr(0,1) === "#") {
				this.elements[attr.nodeName.substring(1,attr.nodeName.length)] = target;
			}
		}.bind(this));
		(function(){
			var index = 0;
			template.childs.forEach((function(x,i){
				index += this.render_element({
					ele: target.childNodes[index],
					data: data,
					template: x,
					parent: target
				});
			}).bind(this));
		}.apply(this));
		return 1;
	}
	
}());
