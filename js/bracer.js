
"use strict";

(function(){

// Finds any values inside a string of text (e.g "example {{value}}"). And uses the current data to fill it out.
// E.g data -> {value:"One"} text -> "example {{value}}" = "example One".
	window._dill.bracer = function(text_node_value,scope_data){
		var sections = text_node_value.split("{{"),
			str = sections.shift();
		sections.forEach(function(x){
			var brace_index = x.indexOf("}}");
			str += this.evaluator(x.substring(0,brace_index),scope_data) + x.substring(brace_index+2,x.length);
		}.bind(this));
		return str;
	}
	
}());
