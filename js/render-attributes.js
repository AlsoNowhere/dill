"use strict";

(function(){

	// var resolve_output = function(){
	// 	var bracer = window._dill.bracer;
	// 	return function(data){
	// 		var output = typeof data === "function"
	// 			? data.apply(this)
	// 			: data;
	// 		console.log("Output: ", output);
	// 		if (output === undefined) {
	// 			return "";
	// 		}
	// 		if (typeof output !== "string") {
	// 			return output;
	// 		}
	// 		return bracer(output);
	// 	}
	// }();

	window._dill.render_attributes = function(target,template){

		// console.log("Attributes: ", target, template);

		// Array.prototype.forEach.apply(target.attributes,[function(x){
		// 	x.nodeValue = this.bracer(x.nodeValue,template.data);
		// }.bind(this)]);


		template.attributes && template.attributes.forEach(function(x){

			// console.log("Each: ", x, template);


			var value = typeof template.data[x.value] === "function"
				? template.data[x.value]()
				: template.data[x.value];

			if (template.component) {
				// template.data[x.name] = x.type === "bind"
				// 	? x.value
					// : typeof template.data._display[x.value] === "function"
					// 	? template.data._display[x.value]()
					// 	: template.data._display[x.value];
					// : resolve_output.apply(template.data,[template.data._display[x.value]]);
			}
			else if (x.name !== "value") {
				target.setAttribute(
					x.name,
					// typeof template.data[x.value] === "function"
					// 	? template.data[x.value]()
					// 	: template.data[x.value]
					// resolve_output.apply(template.data,[template.data[x.value]])
					x.type === "literal"
						? x.value
						: x.type === "bind"
							// ? typeof template.data[x.value] === "function"
							// 	? template.data[x.value]()
							// 	: template.data[x.value]
							? value
							: x.type === "default"
								? this.bracer(x.value,template.data)
								: null

				);
			}
			else {
				// (function(){
					// var value = typeof template.data[x.value] === "function" ? template.data[x.value]() : template.data[x.value];
					
					// if (template.type === "SELECT") {
					// 	setTimeout(function(){
					// 		console.log("FGet: ", value);
					// 		target.value = value;
					// 	},0);
					// }
					// else {
						target.value = value;
					// }
				// }());
			}
		}.bind(this));

		// template.attributes && template.attributes.forEach(function(x){

		// 	// console.log("Value: ", value, x, target);

		// 	if (x.type === "bind") {
		// 		var value = this.debracer(x.value,template.data);
		// 		target.setAttribute(x.name,value);
		// 		return;
		// 	}

			
		// 	var value = this.bracer(x.value,template.data);
		// 	target.setAttribute(x.name,value);
		// 	if (x.name === "value") {
		// 		setTimeout(function(){
		// 			if (value !== undefined) {
		// 				target.value = value;
		// 			}
		// 		},0);
		// 	}
		// 	if (!value) {
		// 		target.removeAttribute(x.name);
		// 	}
		// }.bind(this));



	}
}());
