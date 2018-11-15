
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
				typeof template_object === "object" && Object.keys(template_object).forEach((function(key){
					this[key] = template_object[key];
				}).bind(this));

// If this function has this argument then it has come from a dill-for.
				if (index !== undefined) {
					this._item = template_object;
					this._index = index;
				}

// If scope is not isolated then add a reference to the parent data.
				if (scope) {
					this._display = parent_data;
				}
			};

// Set default scoe to "normal" if undefined.
		scope = scope === "normal" || scope === undefined || scope !== "isolate";

// If scope is not isolated then set the prototype. Inheriting from data parent is the default and handled automatically in JS.
		if (scope) {
			Data.prototype = parent_data;
		}

		return new Data(template_object);
	}
}());
