
"use strict";

(function(){
	window._dill.for_each = function(list,callback){
		var i=0,
			l = list.length;
		for (;i<l;i++) {
			callback(list[i],i);
		}
	}

	window._dill.generate_template = function(ele,type){
		var Template = function(){
			this.value = ele.attributes["dill-"+type].nodeValue;
			this.clone = ele.cloneNode(true);
			this.initial = type === "for" ? 1 : true;
		}
		return new Template();
	}

	window._dill.map_component_attributes = function(component,data){
		this.for_each(component.attributes,function(attr){
			var value = attr.nodeValue;
			if (value.substr(0,1) === "'" && value.substr(value.length-1,1) === "'") {
				data[attr.nodeName] = value.substring(1,value.length-1)
				return;
			}
			if (value === "true" || value === "false") {
				data[attr.nodeName] = value === "true";
				return;
			}
			data[attr.nodeName] = data[this.bracer(value, data._display)];
		}.bind(this));
	}

}());
