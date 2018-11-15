
"use strict";

(function(){

	var debracer = function(text,data){
		var inverse = false,
			output,
			value;
		if (text.substr(0,1) === "!") {
			text = text.substring(1,text.length);
			inverse = true;
		}
		value = data[text];
		output = typeof value === "function"
			? value.apply(data)
			: value;
		if (inverse) {
			output = !output;		
		}
		return output === undefined
			? ""
			: output;
	}

	window._dill.debracer = debracer;

// Finds any values inside a string of text (e.g "example {{value}}"). And uses the current data to fill it out.
// E.g data -> {value:"One"} text -> "example {{value}}" = "example One".
	window._dill.bracer = function(text,data){
		var recurser = function(text_segment){
			var left = text_segment.indexOf("{{"),
				right = text_segment.indexOf("}}");
			if (left === -1) {
				return text_segment;
			}
			if (right === -1) {
				return text_segment;
			}
			return text_segment.substring(0,left)
				+ debracer(
					text_segment.substring(left+2,right),
					data
				)
				+ recurser(
					text_segment.substring(right+2,text_segment.length)
				);
		}
		return recurser(text);
	}
	
}());
