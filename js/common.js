
"use strict";

(function(){
	window._dill.for_each = function(list,callback){
		for (var i=list.length-1;i>=0;i--) {
			callback(list[i],i);
		}
	}

	window._dill.substring = function(context,a,b){
		return String.prototype.substring.apply(context,[a,b]);
	}

	window._dill.evaluator = function(text,scope_data){
		var value,
			output = "",
			inverse = false;
		if (text.charAt(0) === "!") {
			text = text.substring(1,text.length);
			inverse = true;
		}
		value = scope_data[text];
		if (value === undefined) {
			return output;
		}
		if (typeof value === "function") {
			output = value.apply(scope_data);
		}
		else {
			output = value;
		}
		return inverse
			? !output
			: output;
	}
}());
