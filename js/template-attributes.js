
"use strict";

(function(){

	window._dill.create_attributes = function(target,template,module,parent_data){
		var output = [];
		this.for_each(target.attributes,function(attr){
			var name = attr.nodeName,
				value = attr.nodeValue,
				event_name,
				first = name.charAt(0),
				last = name.charAt(name.length-1),
				first_two = name.substr(0,2),
				last_two = name.substr(name.length-2,2),
				literal = value.charAt(0) === "'" && value.charAt(value.length-1,1) === "'",
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

		// If attribute starts with hash then save this element to the module.
			if (name.charAt(0) === "#") {
				module.set_element(name.substring(1,name.length),target);
				// template.data._elements[name.substring(1,name.length)] = target;
				// console.log("Id: ", name, target, template.data._elements);
				return remove_attribute();
			}

		// Form fields have a value property which is harder to set.
		// Instead of doing [value]="value" (input)="update" update: function(e){ this.bubble_change(this,"value",e.target.value)}.
		// Just do [(value)]="value"
			if (name === "[(value)]" || name === ":value:") {
				// output.push({
				// 	name: "value",
				// 	value: value
				// });
				// target.value = template.data[value] ? template.data[value] : "" ;
				target.addEventListener("input",function(){
					template.data[value] = target.value;
					dill.change();
				}.bind(this));
				// return remove_attribute();

				target.setAttribute(":value",value);
				remove_attribute();
			}


			if ( (first_two === "[(" && last_two === ")]") || first === ":" && last === ":" ) {
				if (template.component) {
					define(name.substring(2,name.length-2),true,true);
				}
				// else {
				// 	output.push({
				// 		name: name.substring(1,name.length-(first !== ":")),
				// 		value: value
				// 	});
				// }
				return remove_attribute();
			}

		// If attribute is bindable (surrounded by square brackets or started with :) then save this to the template.
		// Square bracket notation is not valid syntax when setting attributes so use : instead.
		// Square brackets make developing easier as the logic is easier to see.
			if ( (first === "[" && last === "]") || first === ":" ) {
				if (template.component) {
					define(name.substring(1,name.length-1),true,false);
				}
				else {
					output.push({
						name: name.substring(1,name.length-(first !== ":")),
						value: literal
							? value.substring(1,value.length-1)
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
					define(name.substring(1,name.length-1),false,true);
				}
				else {
					event_name = name.substring(last === ":" ? 0 : 1,name.length-1);
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


			else if (name.substr(0,5) !== "dill-") {
				if (template.component) {
					// console.log("Attribute: ", name, value, template.data);
					template.data[name] = parent_data[value];
				}
				else {
					output.push({
						name: name,
						value: literal
							? value.substring(1,value.length-1)
							: value,
						type: literal
							? "literal"
							: "default"
					});
				}
			}

			// else if (name.substr(0,5) !== "dill-") {
			// 	output.push({
			// 		name: name,
			// 		value: value
			// 	});
			// }


		}.bind(this));
		return output;
	}
	
}());
