
"use strict";

(function(){

	window._dill.create_attributes = function(ele,data){
		var output = [];
		this.for_each(ele.attributes,function(attr){
			var name = attr.nodeName,
				event_name,
				first = name.substr(0,1),
				last = name.substr(name.length-1,1),
				finish = function(){
					ele.removeAttribute(name);
				};
			if (name === "[(value)]" || name === ":name:") {
				output.push({
					name:"value",
					value:attr.nodeValue
				});
				ele.value = data[attr.nodeValue] ? data[attr.nodeValue] : "" ;
				ele.addEventListener("input",function(){
					data[attr.nodeValue] = ele.value;
					dill.change();
				}.bind(this));
				finish();
				return;
			}
			if ( (first === "[" && last === "]") || first === ":" ) {
				output.push({
					name:name.substring(1,name.length-(first !== ":")),
					value:attr.nodeValue
				});
				finish();
				return;
			}
			if ( (first === "(" && last === ")") || last === ":" ) {
				event_name = name.substring(1,name.length-(last !== ":"));
				ele.addEventListener(event_name,function(event){
					var returns;
					if (data[attr.nodeValue] === undefined) {
						dill.change();
						return;
					}
					returns = data[attr.nodeValue].apply(data,[event,ele]);
					if (returns === false) {
						return;
					}
					dill.change();
				});
				finish();
			}
		}.bind(this));
		return output;
	}
	
}());
