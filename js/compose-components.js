

"use strict";

(function(){
	window._dill.compose_components = function(element,data,type){
		if (element.nodeName === "#text" || element.nodeName === "#comment") {
			return element;
		}
		if (element.hasAttribute("dill-for") && !type) {
			data = data[element.attributes["dill-for"].nodeValue]
				? this.create_data_object(data[element.attributes["dill-for"].nodeValue][0], data, 0)
				: data;
		}
		if (dill.components[element.nodeName.toLowerCase()]) {
			element.innerHTML = dill.components[element.nodeName.toLowerCase()].template;
			data = this.create_data_object(dill.components[element.nodeName.toLowerCase()].data, data);
		}
		this.create_events(element,data);
		this.for_each(element.childNodes,function(x){
			this.compose_components(x,data);
		}.bind(this));
		return element;
	}
}());






