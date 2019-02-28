"use strict";

(function(){

	var extend = function(ele,scope,value){
		if (value === undefined) {
			throw("No value for property 'dill-extends' on dill-extends=\"" + ele.attributes["dill-extends"].nodeValue + "\"");
		}
		Object.keys(value).forEach(function(key){
			var prop = key,
				first = prop.charAt(0),
				last = prop.charAt(prop.length-1),
				middle = prop.substring(1,prop.length-1);
			if (prop.substring(0,2) === "[(" && prop.substring(prop.length-2,prop.length) === ")]") {
				prop = ":" + prop.substring(2,prop.length-2) + ":";
			}
			else if (first === "[" && last === "]") {
				prop = ":" + middle;
			}
			else if (first === "(" && last === ")") {
				prop = middle + ":";
			}
			if (prop === "oninit") {
				if (typeof value[prop] === "function") {
					value[prop].apply(scope);
				}
				else if ([].isArray(value[prop])) {
					value[prop].forEach(function(x){
						x.apply(scope);
					});
				}
				return;
			}
			ele.setAttribute(prop,value[key]);
		}.bind(this));
	}

	window._dill.dill_extends = function(target,data){
		if (target.hasAttribute("dill-extends")) {
			extend.apply(this,[target,data,data[target.attributes["dill-extends"].nodeValue]]);
			target.removeAttribute("dill-extends");
		}
	}
}());
