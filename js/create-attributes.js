
"use strict";

(function(){

	window._dill.create_attributes = function(ele,data){
		var output = [];
		this.for_each(ele.attributes,function(attr){
			var name = attr.nodeName;
			if (name.substr(0,1) === "[" && name.substr(name.length-1,1) === "]") {
				output.push({
					name:name.substring(1,name.length-1),
					value:attr.nodeValue
				});
			}
		}.bind(this));
		this.create_events(ele,data);
		return output;
	}

	window._dill.create_events = function(ele,data) {
		this.for_each(ele.attributes,function(attr){
			var name = attr.nodeName,
				event_name;
			if (name.substr(0,1) === "(" && name.substr(name.length-1,1) === ")") {
				event_name = name.substring(1,name.length-1);
				ele.addEventListener(event_name,function(event){
					var returns;
					if (data[attr.nodeValue] === undefined) {
						dill.change();
					}
					else {
						returns = data[attr.nodeValue].apply(data,[event]);
						if (returns !== false) {
							dill.change();
						}
					}
				});
			}
		}.bind(this));
	}
	
}());
