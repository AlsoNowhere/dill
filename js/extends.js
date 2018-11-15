"use strict";

(function(){

	var extend = function(ele,value){
		Object.keys(value).forEach(function(key){
			var prop = key.substr(0,1) === "[" && key.substr(key.length-1,1) === "]"
			? ":" + key.substring(1,key.length-1)
			: key.substr(0,1) === "(" && key.substr(key.length-1,1) === ")"
				? key.substring(1,key.length-1) + ":"
				: key;
			ele.setAttribute(prop,value[key]);
		});
	}

	window._dill.dill_extends = function(target,data){
		if (target.hasAttribute("dill-extends")) {
			extend(target,data[target.attributes["dill-extends"].nodeValue]);
		}
	}
}());
