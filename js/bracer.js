
"use strict";

(function(){

	var debracer = function(brace,data){
		var value = typeof data[brace] === "function"
			? data[brace]()
			: data[brace];
		return value === undefined
			? ""
			: value;
	}

// Finds any values inside a string of text (e.g "example {{value}}"). And uses the current data to fill it out.
// E.g data -> {value:"One"} text -> "example {{value}}" = "example One".
	window._dill.bracer = function(text,data){
		var recurser = function(text_segment){
			var left_brace_index = text_segment.indexOf("{{"),
				right_brace_index = text_segment.indexOf("}}");
			if (left_brace_index === -1) {
				return text_segment;
			}
			if (right_brace_index === -1) {
				return text_segment;
			}
			return text_segment.substring(
					0,
					left_brace_index
				)
				+ debracer(
					text_segment.substring(
						left_brace_index+2,
						right_brace_index
					),
					data
				)
				+ recurser(
					text_segment.substring(
						right_brace_index+2,
						text_segment.length
					)
				);
		}
		return recurser(text);
	}
	
}());
