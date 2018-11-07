
"use strict";

(function(){

	window._dill.create_template = function(ele,data){
		var template = {
			type: ele.nodeName,
			value: ele.nodeValue
		}
		if (ele.nodeName === "#text" || ele.nodeName === "#comment") {
			return template;
		}
		if (ele.hasAttribute("dill-if")) {
			template.if = this.generate_template(ele,"if");
		}
		if (ele.hasAttribute("dill-for")) {
			template.for = this.generate_template(ele,"for");
			if (data[template.for.value]) {
				data = this.create_data_object(data[template.for.value][0],data,0);
			}
		}
		if (dill.components[ele.nodeName.toLowerCase()]) {
			ele.innerHTML = dill.components[ele.nodeName.toLowerCase()].template;
			data = this.create_data_object(dill.components[ele.nodeName.toLowerCase()].data,data);
		}
		template.attributes = this.create_attributes(ele,data);
		if (ele.hasAttribute("dill-for")) {
			template.for.currents = [
				function(){
					var clone = ele.cloneNode(true);
					clone.removeAttribute("dill-for");
					return this.create_template(clone,data);
				}.apply(this)
			];
		}
		template.childs = Array.prototype.map.apply(ele.childNodes,[(function(x){
			return this.create_template(x,data);
		}).bind(this)]);
		return template;
	}
	
}());
