"use strict";

(function(){

	var extend = function(ele,scope,value){

		// console.log("Ex: ", ele, value);
		if (value === undefined) {
			throw("No value for property 'dill-extends' on dill-extends=\"" + ele.attributes["dill-extends"].nodeValue + "\"");
		}

		Object.keys(value).forEach(function(key){
			var prop = key.charAt(0) === "[" && key.charAt(key.length-1) === "]"
				? ":" + key.substring(1,key.length-1)
				: key.charAt(0) === "(" && key.charAt(key.length-1) === ")"
					? key.substring(1,key.length-1) + ":"
					: key;
			if (key === "oninit") {
				value[key].apply(scope);
				return;
			}
			ele.setAttribute(prop,value[key]);
			// console.log("Each: ", ele, prop);
		});
	}

	window._dill.dill_extends = function(target,data){
		if (target.hasAttribute("dill-extends")) {
			extend(target,data,data[target.attributes["dill-extends"].nodeValue]);
			target.removeAttribute("dill-extends");
		}
	}
}());
