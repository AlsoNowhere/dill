
"use strict";

(function(){

	window._dill.create_attributes = function(target,template,module,parent_data){
		var output = [];
		this.for_each(target.attributes,function(attr){
			var name = attr.nodeName,
				value = attr.nodeValue,
				event_name,
				name_length = name.length,
				value_length = value.length,
				first = name.charAt(0),
				last = name.charAt(name_length-1),
				literal = value.charAt(0) === "'" && value.charAt(value_length-1,1) === "'",
				remove_attribute = function(){
					target.removeAttribute(name);
				},
				define = function(name,getter, setter){
					var construct = {};
					if (getter){
						construct.get = function(){
							return parent_data[value];
						}
					}
					if (setter) {
						construct.set = function(input){
							dill.bubble_change(parent_data,value,input);
						}
					}
					Object.defineProperty(template.data,name,construct);
				};
			if (first === "#") {
				// template.data._elements[this.substring(name,1,name.length)] = target;



				// template.data[name.substring(1,name.length)] = target;



				Object.defineProperty(template.data,name.substring(1,name.length),{
					get: function(){
						return target;
					}
				});



				return remove_attribute();
			}
		// If attribute is bindable (surrounded by square brackets or started with :) then save this to the template.
		// Square bracket notation is not valid syntax when setting attributes so use : instead.
		// Square brackets make developing easier as the logic is easier to see.
			if ( (first === "[" && last === "]") || first === ":" ) {
				if (template.component) {
					define(this.substring(name,1,name_length-1),true,false);
				}
				else {
					output.push({
						name: this.substring(name,1,name_length-(first !== ":")),
						value: literal
							? this.substring(value,1,value_length-1)
							: value,
						type: literal
							? "literal"
							: "bind"
					});
				}
				return remove_attribute();
			}

		// If the attribute is surrounded by parenthesis ( (a) ), or ends with : then assign a name as an event listener.
			if ( (first === "(" && last === ")") || last === ":" ) {
				if (template.component) {
					define(this.substring(name,1,name_length-1),false,true);
				}
				else {
					event_name = this.substring(name,last === ":" ? 0 : 1,name_length-1);
					target.addEventListener(event_name,function(event){
						var returns;
						if (template.data[value] === undefined) {
							dill.change();
							return;
						}
						returns = template.data[value].apply(template.data,[event,target]);
						if (returns === false) {
							return;
						}
						dill.change();
					});
				}
				return remove_attribute();
			}
			if (name.substr(0,5) === "dill-") {
				return;
			}
			if (template.component) {
				template.data[name] = parent_data[value];
			}
			else {
				output.push({
					name: name,
					value: literal
						? this.substring(value,1,value_length-1)
						: value,
					type: literal
						? "literal"
						: "default"
				});
			}
		}.bind(this));
		return output;
	}
	
}());
