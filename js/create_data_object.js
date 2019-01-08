
"use strict";

(function(){

// Create new data using an existing data structure.
	window._dill.create_data_object = function(input){
		var template_object = input.template_object,
			parent_data = input.parent_data,
			index = input.index,
// Scope can be 'normal', 'isolate'
			scope = input.scope,
			Data = function(template_object){
				// console.log("Template object: ", template_object, this);

				// Object.keys(this).forEach(function(){
				// for (var i in this) {
				// 	if (this.hasOwnProperty(i)) {
				// 		console.log("Keys: ", this[i]);
				// 	}
				// }
				// }.bind(this));




				// if (template_object && template_object.name === 1) {
					// debugger;
				// }



				typeof template_object === "object" && Object.keys(template_object).forEach((function(key){
					// delete this[key];
					// this[key] = template_object[key];
					// console.log("This: ", this, key);
					Object.defineProperty(this,key,{
						value: template_object[key],
						writable: true
					});
				}).bind(this));

// If this function has this argument then it has come from a dill-for.
				if (index !== undefined) {
					this._item = template_object;
					this._index = index;
				}

// If scope is not isolated then add a reference to the parent data.
				if (scope === "normal") {
					this._display = parent_data;
				}

				// console.log("Data: ", this, scope, input);
			};

// Set default scoe to "normal" if undefined.
		scope = scope === undefined || scope !== "isolate"
			? "normal"
			: scope;

// If scope is not isolated then set the prototype. Inheriting from data parent is the default and handled automatically in JS.
		if (scope === "normal") {
			Data.prototype = parent_data;
		}

		return new Data(template_object);
	}
}());
