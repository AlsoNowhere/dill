
"use strict";

(function(){

// Create new data using an existing data structure.
	window._dill.create_data_object = function(input){
		var template_object = typeof input.template_object === "function"
				? new input.template_object()
				: input.template_object,
			parent_data = input.parent_data,
			index = input.index,
// Scope can be 'normal', 'isolate'
			scope = input.scope,
			Data = function(template_object){
				for (var key in (template_object?template_object:{})) {
					(function(){
						var _value;
						if (key !== "oninit" && key !== "ondestory") {
							Object.defineProperty(this,key,{
								get: function(){
									return _value;
								},
								set: function(value){
									_value = value;
								}
							});
						}
						this[key] = template_object[key];
					}.apply(this));
				}

// If this function has this argument then it has come from a dill-for.
				if (index !== undefined) {
					this._item = template_object;
					this._index = index;
				}

// If scope is not isolated then add a reference to the parent data.
				if (scope === "normal" && parent_data) {
					this._display = parent_data;
				}
			};

// Set default scoe to "normal" if undefined.
		scope = scope === undefined || scope !== "isolate"
			? "normal"
			: scope;

// If scope is not isolated then set the prototype. Inheriting from data parent is the default and handled automatically in JS.
		if (scope === "normal") {
			Data.prototype = parent_data;
		}
		var output = new Data(template_object);
		return output;
	}
}());
