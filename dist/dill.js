
"use strict";

(function(){
	window._dill = {
		modules: {}
	};
}());


"use strict";

(function(){

	var debracer = function(text,data){
		var inverse = false,
			output,
			value;
		if (text.charAt(0) === "!") {
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


"use strict";

(function(){

	var Component = function(name,data,template,type,module){
		this.name = name;
		this.data = data;
		this.template = template;
// Default type is global.
// Type can be isolate which means it will not get extended to other modules.
// If type is defined as global it can have a module which will be used from there.
		this.type = type || "global";
		this.module = module;
	}

	window._dill.Component = Component;

	window._dill.generate_component = function(name,data,template_literal,type,module){
		return new Component(name,data,template_literal,type,module);
	};

}());


"use strict";

(function(){

	var Template = function(name,data,module){
		this.type = name;
		this.data = data;
		this.module = module;
		this.data._module = module;
		// this.data._elements = {};
	}

// This function produces a template object which represents an element inside the target section on DOM for Dill.
// The template object is extended which more branches for each child of the element.
	window._dill.create_template = function(target,data,module){
		var template = new Template(target.nodeName,data,module),
			has_for,
			_data = template.data;

// If the element is a text node or comment then that is the end of the template branch.
		if (target.nodeName === "#text" || target.nodeName === "#comment") {
			template.value = target.nodeValue;
			return template;
		}

// If the function exists handle the dill-extends attribute.
		this.dill_extends && this.dill_extends(target,data);
		// console.log("Extends: ", target, data);

// This set for later. It needs to be set here because inside the template_for function it is removed from the element.
// This attribute is removed so that the render function and template function do not get stuck in a loop.
		has_for = target.hasAttribute("dill-for");


		// console.log("Template: ", template, target, target.hasAttribute("dill-for"));


// If the function exists handle the dill-for attribute.
		this.template_for && this.template_for(target,template);

// If the attribute dill-for exists then don't continue, this will be picked on whenever a new element inside this repeat is added and a template with the correct context is generated.
		if (has_for) {
			return template;
		}

// If the function exists handle the dill-if attribute.
		this.template_if && this.template_if(target,template);

// If the function exists handle the dill-template attribute.
		this.dill_template && this.dill_template(target,template);




// If the element is to be added into the module elements (an attribute like #exmaple) then it is found and added here.
		// this.for_each(target.attributes,function(attr){
		// 	var name = attr.nodeName;
		// 	if (name.charAt(0) === "#") {
		// 		module.set_element(name.substring(1,name.length),target);
		// 	}
		// });

// If this is a component then add attribute values (only those written as [example] or :example) to this component instance data.
		// if (component) {
		// 	this.component_attributes(target,template);
		// }
// Otherwise save what the attributes are for rendering.
		// else {

		// }











// If this element is actually a component it will be found and handled as such from here.
// If the function exists handle the component function.
		this.template_component && (function(){
			var _module = this.template_component(target,template,module);
// Overwrite module so that data from this point (i.e inside this component) uses this module.
			if (_module !== undefined) {
				module = dill.module(_module);
				template.data._module = module;
			}
		}.apply(this));
		template.attributes = this.create_attributes(target,template,module,_data);
		if (template.component && template.data.hasOwnProperty("oninit")) {
			template.data.oninit();
		}







// For each child element create a new template branch.
		template.childs = Array.prototype.map.apply(target.childNodes,[(function(x){
			return this.create_template(x,template.data,module);
		}).bind(this)]);

		return template;
	}
}());


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

"use strict";

(function(){

	var extend = function(ele,scope,value){

		// console.log("Ex: ", ele, value);
		if (value === undefined) {
			throw("No value for property 'dill-extends' on dill-extends=\"" + ele.attributes["dill-extends"].nodeValue + "\"");
		}

		Object.keys(value).forEach(function(key){
			var prop = key.charAt(0) === "[" && key.charAt(key.length-1) === "]"
				? ":" + key.substring(1,key.length-1)
				: key.charAt(0) === "(" && key.charAt(key.length-1) === ")"
					? key.substring(1,key.length-1) + ":"
					: key;
			if (key === "oninit") {
				value[key].apply(scope);
				return;
			}
			ele.setAttribute(prop,value[key]);
			// console.log("Each: ", ele, prop);
		});
	}

	window._dill.dill_extends = function(target,data){
		if (target.hasAttribute("dill-extends")) {
			extend(target,data,data[target.attributes["dill-extends"].nodeValue]);
			target.removeAttribute("dill-extends");
		}
	}
}());


"use strict";

(function(){

	window._dill.template_for = function(target,template){
		if (!target.hasAttribute("dill-for") || !template.data[target.attributes["dill-for"].nodeValue]) {
			return;
		}
		var length = template.data[target.attributes["dill-for"].nodeValue].length,
			value = target.attributes["dill-for"].nodeValue,
			data;
		data = this.create_data_object({
			template_object:template.data[target.attributes["dill-for"].nodeValue][0],
			parent_data:template.data,
			index:0
		});
		template.data = data;
		target.removeAttribute("dill-for");
		template.for = {
			clone: target.cloneNode(true),
			initial: 1,
			currents: length > 0
				? [this.create_template(target,data,template.module)]
				: [],
			value: value
		}
	}

	window._dill.render_for = function(target,template){
		var target_end_for = target,
			i,
			data,
			_template,
			items = template.data[template.for.value];

		// console.log("Items: ", items, template);

		// if (target.nodeName === "OPTION") {
			// console.log("Option: ", template.for);
			// debugger;
		// }

// If this for loop has been behind an if to begin with then it will have an initial of 1 but no currents.
// This can be discovered and corrected by adding in the missing current for the intial below.
		if (template.for.initial === 1 && template.for.currents.length === 0) {
			template.for.currents.push(this.create_template(target_end_for,template.data,template.module));
		}

		if (template.for.initial < items.length) {
			for (i=1;i<template.for.initial;i++) {
				target_end_for = target_end_for.nextElementSibling;
			}
			for (i=template.for.initial;i<items.length;i++) {
				if (template.for.initial === 0 && i === template.for.initial) {
					target_end_for.parentNode.insertBefore(template.for.clone.cloneNode(true), target);
					target_end_for = target.previousElementSibling;
				}
				else {
					target_end_for.insertAdjacentElement("afterend", template.for.clone.cloneNode(true));
					target_end_for = target_end_for.nextElementSibling;
				}
				data = this.create_data_object({
					template_object:items[i],
					parent_data:template.data._display,
					index:i
				});
				template.data = data;
				target_end_for.removeAttribute("dill-for");
				_template = this.create_template(target_end_for,template.data,template.module);
				template.for.currents.push(_template);
			}
		}
		else if (template.for.initial > items.length) {
			for (i=0;i<items.length;i++) {
				target_end_for = target_end_for.nextElementSibling;
			}
			for (i=0;i<template.for.initial-items.length;i++) {
				target_end_for.parentNode.removeChild(
					i === template.for.initial-items.length-1
						? target_end_for
						: target_end_for.nextElementSibling
				);
				template.for.currents.pop();
			}
		}
		target_end_for = target;
		if (template.for.initial === 0) {
			for (i=0;i<items.length;i++) {
				target_end_for = target_end_for.previousElementSibling;
			}
		}

		// console.log("Render for: ", template.for.initial, template.for.currents.length, template.for.currents[0] && template.for.currents[0].data._item);

		template.for.initial = items.length;
		for (i=0;i<template.for.initial;i++) {
			template.for.currents[i].data._item = items[i];
			template.for.currents[i].data._index = i;
			typeof items[i] === "object" && Object.keys(items[i]).forEach(function(key){
				template.for.currents[i].data[key] = items[i][key];
			});
			// console.log("Each: ", target_end_for, template.for.currents[i].data._item)
			this.render_element(target_end_for,template.for.currents[i]);
			target_end_for = target_end_for.nextElementSibling;
		}
		return template.for.initial;
	}
}());


"use strict";

(function(){

	window._dill.template_if = function(target,template){
		if (target.hasAttribute("dill-if")) {
			template.if = {
				element: target,
				value: target.attributes["dill-if"].nodeValue,
				initial: true,
				parent: target.parentNode
			}
		}
	}

	window._dill.render_if = function(target,template){
		var if_value = this.debracer(template.if.value,template.data);
		// console.log("Value if: ", if_value, template.if.initial);
		if (!template.if.initial && if_value) {
			if (target === undefined) {
				template.if.parent.appendChild(template.if.element);
			}
			else {
				target.parentNode.insertBefore(template.if.element,target);
			}
			target = template.if.element;
			template.if.initial = if_value;
		}
		else if (template.if.initial && !if_value) {
			target.parentNode.removeChild(target);
			template.if.initial = if_value;
			return 0;
		}
		else if (!template.if.initial && !if_value) {
			return 0;
		}
		return target;
	}
	
}());


"use strict";

(function(){
	window._dill.for_each = function(list,callback){
		for (var i=list.length-1;i>=0;i--) {
			callback(list[i],i);
		}
	}
}());

"use strict";

(function(){

	var ref = window._dill;
	var Module = function(name,scope,modules){
		this.name = name;
		this.components = {};
		this.services = {};
		this.elements = {};
		modules && modules.forEach(function(x){
			var elements;
			if (typeof x === "string") {
				x = scope.modules[x];
			}
			else if (!(x instanceof Module)) {
				return;
			}
			elements = Object.keys(x.elements);
			Object.keys(x.components).forEach(function(component){
				// console.log("Cop: ", component, x.components[component]);
				if (x.components[component].type === "global") {
					this.components[component] = x.components[component];
				}
			}.bind(this));
			Object.keys(x.services).forEach(function(service){
				this.services[service] = x.services[service];
			}.bind(this));
		}.bind(this));
	}
	Module.prototype = {
		set_component: function(component, type){
			this.components[component.name] = component;
		},
		set_service: function(service){
			this.services[service.name] = service.data;
		},
		set_element: function(name,element){
			this.elements[name] = element;
		}
	}

	window._dill.Module = Module;

	var new_module = function(){
		var Module = window._dill.Module;
		return function(name,scope,modules){
			var output = new Module(name,scope,modules);
			Object.seal(output);
			Object.freeze(output);
			return output;
		}
	}();

	window._dill.create_module = function(name,scope,modules){
		return new_module(name,scope,modules);
	}
}());

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


"use strict";

(function(){

	window._dill.render_element = function(target,template){
		var if_value;

		if (template.type === "#text") {
			target.nodeValue = this.bracer(template.value,template.data);
			return 1;
		}
		if (template.type === "#comment") {
			return 1;
		}
		
		if (template.hasOwnProperty("for")) {
			return this.render_for(target,template);
		}
		if (template.hasOwnProperty("if")) {
			if_value = this.render_if(target,template);
			if (if_value === 0) {
				return if_value;
			}
			target = if_value;
		}
		if (template.template) {
			(function(){
				var _template = template.template;
				target.innerHTML = typeof _template === "function" ? _template.apply(template.data) : _template;
				template = this.create_template(target,template.data,template.module);
				this.render_element(target,template);
				template.template = _template;
			}.apply(this));
		}
		this.render_attributes(target,template);
		// console.log("Render: ", target, template.data);
		// if (target.nodeName === "LI") {
		// 	debugger;
		// }
		(function(){
			var index = 0;
			template.childs && template.childs.forEach((function(x,i){
				index += this.render_element(target.childNodes[index],x);
			}).bind(this));
		}.apply(this));
		return 1;
	}
	
}());


"use strict";

(function(){

	var Service = function(name,input){
		this.name = name;
		this.data = typeof input === "function"
			? (new input())
			: typeof input === "object" && !Array.isArray(input)
				? input
				: null
	}

	window._dill.Service = Service;

	window._dill.generate_service = function(name,input){
		return new Service(name,input);
	};
}());


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


"use strict";

(function(){

	window._dill.template_component = function(target,template,module){


// Check that to see if this element is actually a component on this module, if not then return undefined and do not process element as a component.
		var current_component = module.components[target.nodeName.toLowerCase()];
		if (!current_component) {
			return;
		}




		template.component = true;





		// if (typeof current_component.data === "object") {
		// 	template.data = this.create_data_object({
		// 		template_object:current_component.data,
		// 		parent_data:template.data,
		// 		scope:target.hasAttribute("dill-scope")
		// 			? target.attributes["dill-scope"].nodeValue
		// 			: undefined
		// 	});
		// }
		// else 
			if (typeof current_component.data === "function") {
			// template.data = new current_component.data();
			// (function(){
			// 	var _data = new current_component.data();
			// 	template.data = this.create_data_object({
			// 		template_object:_data,
			// 		parent_data:template.data,
			// 		scope:target.hasAttribute("dill-scope")
			// 			? target.attributes["dill-scope"].nodeValue
			// 			: undefined
			// 	});
			// }.apply(this));

			current_component.data = new current_component.data();



		}

		// console.log("Component 1: ", current_component, template.data);


		template.data = this.create_data_object({
			template_object:current_component.data,
			parent_data:template.data,
			scope:target.hasAttribute("dill-scope")
				? target.attributes["dill-scope"].nodeValue
				: undefined
		});


		template.data._template = target.innerHTML;
		target.innerHTML = current_component.template;

		// console.log("Component 2: ", template);




		// if (template.data.hasOwnProperty("oninit")) {
		// 	template.data.oninit();
		// }




		if (current_component.hasOwnProperty("module")) {
			return current_component.module;
		}





	}

	// window._dill.component_attributes = function(target,template){
	// 	this.for_each(target.attributes,function(attr){
	// 		var name = attr.nodeName,
	// 			value,
	// 			l,
	// 			first = name.charAt(0),
	// 			last = name.charAt(name.length-1);
	// 		if ( !( (first === "[" && last === "]") || first === ":" ) ) {
	// 			return;
	// 		}
	// 		value = attr.nodeValue;
	// 		l = value.length;
	// 		value = (value.charAt(0) === "'" && value.substr(l-1,l) === "'")
	// 			? value.substring(1,l-1) === "true"
	// 				? true
	// 				: value.substring(1,l-1) === "false"
	// 					? false
	// 					: value.substring(1,l-1)
	// 			: template.data._display[value];
	// 		name = name.substring(1,name.length-(first !== ":"));
	// 		template.data[name] = value;
	// 	});
	// }

}());

"use strict";

(function(){
	window._dill.dill_template = function(target,template){
		var _template,
			value;
		if (target.hasAttribute("dill-template")) {


			// console.log("Template: ", target, template.data);

			// _template = target.innerHTML;
			value = template.data[target.attributes["dill-template"].nodeValue];
			// value = typeof value === "function" ? value.apply(template.data) : value;
			// if (value !== false) {
			// 	target.innerHTML = value;
			// }
			// template.data._template = _template;
			template.template = value;
			target.removeAttribute("dill-template");



		}
	}
}());


"use strict";

(function(){

	var renders = [],
		ref = window._dill,
		Dill = function(){
			this.modules = {};
			this.module = function(name,modules){
				if (this.modules[name]) {
					return this.modules[name];
				}
				this.modules[name] = ref.create_module(name,this,modules===undefined?[]:modules);
				return this.modules[name];
			}
			this.render = function(a,b,c){
				var template,
					target,
					initial_data,
					module,
					set_root = function(){
						var _target = document.getElementById("dill-root");
						return _target === null ? document.body : _target;
					};

				target = a;
				initial_data = b;
				module = c;
				// if (arguments.length === 3) {
				// 	target = a;
				// 	initial_data = b;
				// 	module = c;
				// }
				// else if (arguments.length === 2) {
				// 	if (a instanceof HTMLElement) {
				// 		target = a;
				// 		if (b instanceof ref.Module) {
				// 			initial_data = {};
				// 			module = b;
				// 		}
				// 		else {
				// 			initial_data = b;
				// 			module = this.module();
				// 		}
				// 	}
				// 	else {
				// 		target = set_root();
				// 		initial_data = a;
				// 		module = b;
				// 	}
				// }
				// else if (arguments.length === 1) {
				// 	if (a instanceof HTMLElement) {
				// 		target = a;
				// 		initial_data = {};
				// 		module = this.module();
				// 	}
				// 	else if (a instanceof ref.Module) {
				// 		target = set_root();
				// 		initial_data = b;
				// 		module = a;
				// 	}
				// 	else if (
				// 		a.hasOwnProperty("target")
				// 		&& a.hasOwnProperty("initial_data")
				// 		&& a.hasOwnProperty("module")
				// 	) {
				// 		target = a.target;
				// 		initial_data = a.initial_data;
				// 		module = a.module;
				// 	}
				// 	else {
				// 		target = set_root();
				// 		initial_data = a;
				// 		module = this.module();
				// 	}
				// }
				template = ref.create_template(target,initial_data,module);
				ref.render_element(target,template);
				renders.push({target:target,template:template});
			}
			this.change = function(event){
				event && event();
				renders.forEach(function(x){
					ref.render_element(x.target,x.template);
				}.bind(this));
			};
			this.component = window._dill.generate_component;
			this.service = window._dill.generate_service;
			this.bubble_change = function(data,target,value){
				var recurser = function(data,target,value){
					if (data.hasOwnProperty(target)) {
						data[target] = value;
						return;
					}
					if (data.hasOwnProperty("_display")) {
						return recurser(data._display,target,value);
					}
				}
				recurser(data,target,value);
			}
		};

	window.dill = new Dill();
	delete window._dill;
}());

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFfaW5pdC5qcyIsImJyYWNlci5qcyIsImNvbXBvbmVudC5qcyIsImNyZWF0ZS10ZW1wbGF0ZS5qcyIsImNyZWF0ZV9kYXRhX29iamVjdC5qcyIsImV4dGVuZHMuanMiLCJmb3IuanMiLCJpZi5qcyIsIm1pc2MuanMiLCJtb2R1bGUuanMiLCJyZW5kZXItYXR0cmlidXRlcy5qcyIsInJlbmRlci1lbGVtZW50LmpzIiwic2VydmljZS5qcyIsInRlbXBsYXRlLWF0dHJpYnV0ZXMuanMiLCJ0ZW1wbGF0ZS1jb21wb25lbnQuanMiLCJ0ZW1wbGF0ZS5qcyIsInpfbWFpbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDcERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQy9HQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3JFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDN0dBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzFEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNqSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdkpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZGlsbC5qcyIsInNvdXJjZXNDb250ZW50IjpbIlxyXG5cInVzZSBzdHJpY3RcIjtcclxuXHJcbihmdW5jdGlvbigpe1xyXG5cdHdpbmRvdy5fZGlsbCA9IHtcclxuXHRcdG1vZHVsZXM6IHt9XHJcblx0fTtcclxufSgpKTtcclxuIiwiXHJcblwidXNlIHN0cmljdFwiO1xyXG5cclxuKGZ1bmN0aW9uKCl7XHJcblxyXG5cdHZhciBkZWJyYWNlciA9IGZ1bmN0aW9uKHRleHQsZGF0YSl7XHJcblx0XHR2YXIgaW52ZXJzZSA9IGZhbHNlLFxyXG5cdFx0XHRvdXRwdXQsXHJcblx0XHRcdHZhbHVlO1xyXG5cdFx0aWYgKHRleHQuY2hhckF0KDApID09PSBcIiFcIikge1xyXG5cdFx0XHR0ZXh0ID0gdGV4dC5zdWJzdHJpbmcoMSx0ZXh0Lmxlbmd0aCk7XHJcblx0XHRcdGludmVyc2UgPSB0cnVlO1xyXG5cdFx0fVxyXG5cdFx0dmFsdWUgPSBkYXRhW3RleHRdO1xyXG5cdFx0b3V0cHV0ID0gdHlwZW9mIHZhbHVlID09PSBcImZ1bmN0aW9uXCJcclxuXHRcdFx0PyB2YWx1ZS5hcHBseShkYXRhKVxyXG5cdFx0XHQ6IHZhbHVlO1xyXG5cdFx0aWYgKGludmVyc2UpIHtcclxuXHRcdFx0b3V0cHV0ID0gIW91dHB1dDtcdFx0XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gb3V0cHV0ID09PSB1bmRlZmluZWRcclxuXHRcdFx0PyBcIlwiXHJcblx0XHRcdDogb3V0cHV0O1xyXG5cdH1cclxuXHJcblx0d2luZG93Ll9kaWxsLmRlYnJhY2VyID0gZGVicmFjZXI7XHJcblxyXG4vLyBGaW5kcyBhbnkgdmFsdWVzIGluc2lkZSBhIHN0cmluZyBvZiB0ZXh0IChlLmcgXCJleGFtcGxlIHt7dmFsdWV9fVwiKS4gQW5kIHVzZXMgdGhlIGN1cnJlbnQgZGF0YSB0byBmaWxsIGl0IG91dC5cclxuLy8gRS5nIGRhdGEgLT4ge3ZhbHVlOlwiT25lXCJ9IHRleHQgLT4gXCJleGFtcGxlIHt7dmFsdWV9fVwiID0gXCJleGFtcGxlIE9uZVwiLlxyXG5cdHdpbmRvdy5fZGlsbC5icmFjZXIgPSBmdW5jdGlvbih0ZXh0LGRhdGEpe1xyXG5cdFx0dmFyIHJlY3Vyc2VyID0gZnVuY3Rpb24odGV4dF9zZWdtZW50KXtcclxuXHRcdFx0dmFyIGxlZnQgPSB0ZXh0X3NlZ21lbnQuaW5kZXhPZihcInt7XCIpLFxyXG5cdFx0XHRcdHJpZ2h0ID0gdGV4dF9zZWdtZW50LmluZGV4T2YoXCJ9fVwiKTtcclxuXHRcdFx0aWYgKGxlZnQgPT09IC0xKSB7XHJcblx0XHRcdFx0cmV0dXJuIHRleHRfc2VnbWVudDtcclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAocmlnaHQgPT09IC0xKSB7XHJcblx0XHRcdFx0cmV0dXJuIHRleHRfc2VnbWVudDtcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gdGV4dF9zZWdtZW50LnN1YnN0cmluZygwLGxlZnQpXHJcblx0XHRcdFx0KyBkZWJyYWNlcihcclxuXHRcdFx0XHRcdHRleHRfc2VnbWVudC5zdWJzdHJpbmcobGVmdCsyLHJpZ2h0KSxcclxuXHRcdFx0XHRcdGRhdGFcclxuXHRcdFx0XHQpXHJcblx0XHRcdFx0KyByZWN1cnNlcihcclxuXHRcdFx0XHRcdHRleHRfc2VnbWVudC5zdWJzdHJpbmcocmlnaHQrMix0ZXh0X3NlZ21lbnQubGVuZ3RoKVxyXG5cdFx0XHRcdCk7XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gcmVjdXJzZXIodGV4dCk7XHJcblx0fVxyXG5cdFxyXG59KCkpO1xyXG4iLCJcclxuXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG4oZnVuY3Rpb24oKXtcclxuXHJcblx0dmFyIENvbXBvbmVudCA9IGZ1bmN0aW9uKG5hbWUsZGF0YSx0ZW1wbGF0ZSx0eXBlLG1vZHVsZSl7XHJcblx0XHR0aGlzLm5hbWUgPSBuYW1lO1xyXG5cdFx0dGhpcy5kYXRhID0gZGF0YTtcclxuXHRcdHRoaXMudGVtcGxhdGUgPSB0ZW1wbGF0ZTtcclxuLy8gRGVmYXVsdCB0eXBlIGlzIGdsb2JhbC5cclxuLy8gVHlwZSBjYW4gYmUgaXNvbGF0ZSB3aGljaCBtZWFucyBpdCB3aWxsIG5vdCBnZXQgZXh0ZW5kZWQgdG8gb3RoZXIgbW9kdWxlcy5cclxuLy8gSWYgdHlwZSBpcyBkZWZpbmVkIGFzIGdsb2JhbCBpdCBjYW4gaGF2ZSBhIG1vZHVsZSB3aGljaCB3aWxsIGJlIHVzZWQgZnJvbSB0aGVyZS5cclxuXHRcdHRoaXMudHlwZSA9IHR5cGUgfHwgXCJnbG9iYWxcIjtcclxuXHRcdHRoaXMubW9kdWxlID0gbW9kdWxlO1xyXG5cdH1cclxuXHJcblx0d2luZG93Ll9kaWxsLkNvbXBvbmVudCA9IENvbXBvbmVudDtcclxuXHJcblx0d2luZG93Ll9kaWxsLmdlbmVyYXRlX2NvbXBvbmVudCA9IGZ1bmN0aW9uKG5hbWUsZGF0YSx0ZW1wbGF0ZV9saXRlcmFsLHR5cGUsbW9kdWxlKXtcclxuXHRcdHJldHVybiBuZXcgQ29tcG9uZW50KG5hbWUsZGF0YSx0ZW1wbGF0ZV9saXRlcmFsLHR5cGUsbW9kdWxlKTtcclxuXHR9O1xyXG5cclxufSgpKTtcclxuIiwiXHJcblwidXNlIHN0cmljdFwiO1xyXG5cclxuKGZ1bmN0aW9uKCl7XHJcblxyXG5cdHZhciBUZW1wbGF0ZSA9IGZ1bmN0aW9uKG5hbWUsZGF0YSxtb2R1bGUpe1xyXG5cdFx0dGhpcy50eXBlID0gbmFtZTtcclxuXHRcdHRoaXMuZGF0YSA9IGRhdGE7XHJcblx0XHR0aGlzLm1vZHVsZSA9IG1vZHVsZTtcclxuXHRcdHRoaXMuZGF0YS5fbW9kdWxlID0gbW9kdWxlO1xyXG5cdFx0Ly8gdGhpcy5kYXRhLl9lbGVtZW50cyA9IHt9O1xyXG5cdH1cclxuXHJcbi8vIFRoaXMgZnVuY3Rpb24gcHJvZHVjZXMgYSB0ZW1wbGF0ZSBvYmplY3Qgd2hpY2ggcmVwcmVzZW50cyBhbiBlbGVtZW50IGluc2lkZSB0aGUgdGFyZ2V0IHNlY3Rpb24gb24gRE9NIGZvciBEaWxsLlxyXG4vLyBUaGUgdGVtcGxhdGUgb2JqZWN0IGlzIGV4dGVuZGVkIHdoaWNoIG1vcmUgYnJhbmNoZXMgZm9yIGVhY2ggY2hpbGQgb2YgdGhlIGVsZW1lbnQuXHJcblx0d2luZG93Ll9kaWxsLmNyZWF0ZV90ZW1wbGF0ZSA9IGZ1bmN0aW9uKHRhcmdldCxkYXRhLG1vZHVsZSl7XHJcblx0XHR2YXIgdGVtcGxhdGUgPSBuZXcgVGVtcGxhdGUodGFyZ2V0Lm5vZGVOYW1lLGRhdGEsbW9kdWxlKSxcclxuXHRcdFx0aGFzX2ZvcixcclxuXHRcdFx0X2RhdGEgPSB0ZW1wbGF0ZS5kYXRhO1xyXG5cclxuLy8gSWYgdGhlIGVsZW1lbnQgaXMgYSB0ZXh0IG5vZGUgb3IgY29tbWVudCB0aGVuIHRoYXQgaXMgdGhlIGVuZCBvZiB0aGUgdGVtcGxhdGUgYnJhbmNoLlxyXG5cdFx0aWYgKHRhcmdldC5ub2RlTmFtZSA9PT0gXCIjdGV4dFwiIHx8IHRhcmdldC5ub2RlTmFtZSA9PT0gXCIjY29tbWVudFwiKSB7XHJcblx0XHRcdHRlbXBsYXRlLnZhbHVlID0gdGFyZ2V0Lm5vZGVWYWx1ZTtcclxuXHRcdFx0cmV0dXJuIHRlbXBsYXRlO1xyXG5cdFx0fVxyXG5cclxuLy8gSWYgdGhlIGZ1bmN0aW9uIGV4aXN0cyBoYW5kbGUgdGhlIGRpbGwtZXh0ZW5kcyBhdHRyaWJ1dGUuXHJcblx0XHR0aGlzLmRpbGxfZXh0ZW5kcyAmJiB0aGlzLmRpbGxfZXh0ZW5kcyh0YXJnZXQsZGF0YSk7XHJcblx0XHQvLyBjb25zb2xlLmxvZyhcIkV4dGVuZHM6IFwiLCB0YXJnZXQsIGRhdGEpO1xyXG5cclxuLy8gVGhpcyBzZXQgZm9yIGxhdGVyLiBJdCBuZWVkcyB0byBiZSBzZXQgaGVyZSBiZWNhdXNlIGluc2lkZSB0aGUgdGVtcGxhdGVfZm9yIGZ1bmN0aW9uIGl0IGlzIHJlbW92ZWQgZnJvbSB0aGUgZWxlbWVudC5cclxuLy8gVGhpcyBhdHRyaWJ1dGUgaXMgcmVtb3ZlZCBzbyB0aGF0IHRoZSByZW5kZXIgZnVuY3Rpb24gYW5kIHRlbXBsYXRlIGZ1bmN0aW9uIGRvIG5vdCBnZXQgc3R1Y2sgaW4gYSBsb29wLlxyXG5cdFx0aGFzX2ZvciA9IHRhcmdldC5oYXNBdHRyaWJ1dGUoXCJkaWxsLWZvclwiKTtcclxuXHJcblxyXG5cdFx0Ly8gY29uc29sZS5sb2coXCJUZW1wbGF0ZTogXCIsIHRlbXBsYXRlLCB0YXJnZXQsIHRhcmdldC5oYXNBdHRyaWJ1dGUoXCJkaWxsLWZvclwiKSk7XHJcblxyXG5cclxuLy8gSWYgdGhlIGZ1bmN0aW9uIGV4aXN0cyBoYW5kbGUgdGhlIGRpbGwtZm9yIGF0dHJpYnV0ZS5cclxuXHRcdHRoaXMudGVtcGxhdGVfZm9yICYmIHRoaXMudGVtcGxhdGVfZm9yKHRhcmdldCx0ZW1wbGF0ZSk7XHJcblxyXG4vLyBJZiB0aGUgYXR0cmlidXRlIGRpbGwtZm9yIGV4aXN0cyB0aGVuIGRvbid0IGNvbnRpbnVlLCB0aGlzIHdpbGwgYmUgcGlja2VkIG9uIHdoZW5ldmVyIGEgbmV3IGVsZW1lbnQgaW5zaWRlIHRoaXMgcmVwZWF0IGlzIGFkZGVkIGFuZCBhIHRlbXBsYXRlIHdpdGggdGhlIGNvcnJlY3QgY29udGV4dCBpcyBnZW5lcmF0ZWQuXHJcblx0XHRpZiAoaGFzX2Zvcikge1xyXG5cdFx0XHRyZXR1cm4gdGVtcGxhdGU7XHJcblx0XHR9XHJcblxyXG4vLyBJZiB0aGUgZnVuY3Rpb24gZXhpc3RzIGhhbmRsZSB0aGUgZGlsbC1pZiBhdHRyaWJ1dGUuXHJcblx0XHR0aGlzLnRlbXBsYXRlX2lmICYmIHRoaXMudGVtcGxhdGVfaWYodGFyZ2V0LHRlbXBsYXRlKTtcclxuXHJcbi8vIElmIHRoZSBmdW5jdGlvbiBleGlzdHMgaGFuZGxlIHRoZSBkaWxsLXRlbXBsYXRlIGF0dHJpYnV0ZS5cclxuXHRcdHRoaXMuZGlsbF90ZW1wbGF0ZSAmJiB0aGlzLmRpbGxfdGVtcGxhdGUodGFyZ2V0LHRlbXBsYXRlKTtcclxuXHJcblxyXG5cclxuXHJcbi8vIElmIHRoZSBlbGVtZW50IGlzIHRvIGJlIGFkZGVkIGludG8gdGhlIG1vZHVsZSBlbGVtZW50cyAoYW4gYXR0cmlidXRlIGxpa2UgI2V4bWFwbGUpIHRoZW4gaXQgaXMgZm91bmQgYW5kIGFkZGVkIGhlcmUuXHJcblx0XHQvLyB0aGlzLmZvcl9lYWNoKHRhcmdldC5hdHRyaWJ1dGVzLGZ1bmN0aW9uKGF0dHIpe1xyXG5cdFx0Ly8gXHR2YXIgbmFtZSA9IGF0dHIubm9kZU5hbWU7XHJcblx0XHQvLyBcdGlmIChuYW1lLmNoYXJBdCgwKSA9PT0gXCIjXCIpIHtcclxuXHRcdC8vIFx0XHRtb2R1bGUuc2V0X2VsZW1lbnQobmFtZS5zdWJzdHJpbmcoMSxuYW1lLmxlbmd0aCksdGFyZ2V0KTtcclxuXHRcdC8vIFx0fVxyXG5cdFx0Ly8gfSk7XHJcblxyXG4vLyBJZiB0aGlzIGlzIGEgY29tcG9uZW50IHRoZW4gYWRkIGF0dHJpYnV0ZSB2YWx1ZXMgKG9ubHkgdGhvc2Ugd3JpdHRlbiBhcyBbZXhhbXBsZV0gb3IgOmV4YW1wbGUpIHRvIHRoaXMgY29tcG9uZW50IGluc3RhbmNlIGRhdGEuXHJcblx0XHQvLyBpZiAoY29tcG9uZW50KSB7XHJcblx0XHQvLyBcdHRoaXMuY29tcG9uZW50X2F0dHJpYnV0ZXModGFyZ2V0LHRlbXBsYXRlKTtcclxuXHRcdC8vIH1cclxuLy8gT3RoZXJ3aXNlIHNhdmUgd2hhdCB0aGUgYXR0cmlidXRlcyBhcmUgZm9yIHJlbmRlcmluZy5cclxuXHRcdC8vIGVsc2Uge1xyXG5cclxuXHRcdC8vIH1cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG4vLyBJZiB0aGlzIGVsZW1lbnQgaXMgYWN0dWFsbHkgYSBjb21wb25lbnQgaXQgd2lsbCBiZSBmb3VuZCBhbmQgaGFuZGxlZCBhcyBzdWNoIGZyb20gaGVyZS5cclxuLy8gSWYgdGhlIGZ1bmN0aW9uIGV4aXN0cyBoYW5kbGUgdGhlIGNvbXBvbmVudCBmdW5jdGlvbi5cclxuXHRcdHRoaXMudGVtcGxhdGVfY29tcG9uZW50ICYmIChmdW5jdGlvbigpe1xyXG5cdFx0XHR2YXIgX21vZHVsZSA9IHRoaXMudGVtcGxhdGVfY29tcG9uZW50KHRhcmdldCx0ZW1wbGF0ZSxtb2R1bGUpO1xyXG4vLyBPdmVyd3JpdGUgbW9kdWxlIHNvIHRoYXQgZGF0YSBmcm9tIHRoaXMgcG9pbnQgKGkuZSBpbnNpZGUgdGhpcyBjb21wb25lbnQpIHVzZXMgdGhpcyBtb2R1bGUuXHJcblx0XHRcdGlmIChfbW9kdWxlICE9PSB1bmRlZmluZWQpIHtcclxuXHRcdFx0XHRtb2R1bGUgPSBkaWxsLm1vZHVsZShfbW9kdWxlKTtcclxuXHRcdFx0XHR0ZW1wbGF0ZS5kYXRhLl9tb2R1bGUgPSBtb2R1bGU7XHJcblx0XHRcdH1cclxuXHRcdH0uYXBwbHkodGhpcykpO1xyXG5cdFx0dGVtcGxhdGUuYXR0cmlidXRlcyA9IHRoaXMuY3JlYXRlX2F0dHJpYnV0ZXModGFyZ2V0LHRlbXBsYXRlLG1vZHVsZSxfZGF0YSk7XHJcblx0XHRpZiAodGVtcGxhdGUuY29tcG9uZW50ICYmIHRlbXBsYXRlLmRhdGEuaGFzT3duUHJvcGVydHkoXCJvbmluaXRcIikpIHtcclxuXHRcdFx0dGVtcGxhdGUuZGF0YS5vbmluaXQoKTtcclxuXHRcdH1cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcbi8vIEZvciBlYWNoIGNoaWxkIGVsZW1lbnQgY3JlYXRlIGEgbmV3IHRlbXBsYXRlIGJyYW5jaC5cclxuXHRcdHRlbXBsYXRlLmNoaWxkcyA9IEFycmF5LnByb3RvdHlwZS5tYXAuYXBwbHkodGFyZ2V0LmNoaWxkTm9kZXMsWyhmdW5jdGlvbih4KXtcclxuXHRcdFx0cmV0dXJuIHRoaXMuY3JlYXRlX3RlbXBsYXRlKHgsdGVtcGxhdGUuZGF0YSxtb2R1bGUpO1xyXG5cdFx0fSkuYmluZCh0aGlzKV0pO1xyXG5cclxuXHRcdHJldHVybiB0ZW1wbGF0ZTtcclxuXHR9XHJcbn0oKSk7XHJcbiIsIlxyXG5cInVzZSBzdHJpY3RcIjtcclxuXHJcbihmdW5jdGlvbigpe1xyXG5cclxuLy8gQ3JlYXRlIG5ldyBkYXRhIHVzaW5nIGFuIGV4aXN0aW5nIGRhdGEgc3RydWN0dXJlLlxyXG5cdHdpbmRvdy5fZGlsbC5jcmVhdGVfZGF0YV9vYmplY3QgPSBmdW5jdGlvbihpbnB1dCl7XHJcblx0XHR2YXIgdGVtcGxhdGVfb2JqZWN0ID0gaW5wdXQudGVtcGxhdGVfb2JqZWN0LFxyXG5cdFx0XHRwYXJlbnRfZGF0YSA9IGlucHV0LnBhcmVudF9kYXRhLFxyXG5cdFx0XHRpbmRleCA9IGlucHV0LmluZGV4LFxyXG4vLyBTY29wZSBjYW4gYmUgJ25vcm1hbCcsICdpc29sYXRlJ1xyXG5cdFx0XHRzY29wZSA9IGlucHV0LnNjb3BlLFxyXG5cdFx0XHREYXRhID0gZnVuY3Rpb24odGVtcGxhdGVfb2JqZWN0KXtcclxuXHRcdFx0XHQvLyBjb25zb2xlLmxvZyhcIlRlbXBsYXRlIG9iamVjdDogXCIsIHRlbXBsYXRlX29iamVjdCwgdGhpcyk7XHJcblxyXG5cdFx0XHRcdC8vIE9iamVjdC5rZXlzKHRoaXMpLmZvckVhY2goZnVuY3Rpb24oKXtcclxuXHRcdFx0XHQvLyBmb3IgKHZhciBpIGluIHRoaXMpIHtcclxuXHRcdFx0XHQvLyBcdGlmICh0aGlzLmhhc093blByb3BlcnR5KGkpKSB7XHJcblx0XHRcdFx0Ly8gXHRcdGNvbnNvbGUubG9nKFwiS2V5czogXCIsIHRoaXNbaV0pO1xyXG5cdFx0XHRcdC8vIFx0fVxyXG5cdFx0XHRcdC8vIH1cclxuXHRcdFx0XHQvLyB9LmJpbmQodGhpcykpO1xyXG5cclxuXHJcblxyXG5cclxuXHRcdFx0XHQvLyBpZiAodGVtcGxhdGVfb2JqZWN0ICYmIHRlbXBsYXRlX29iamVjdC5uYW1lID09PSAxKSB7XHJcblx0XHRcdFx0XHQvLyBkZWJ1Z2dlcjtcclxuXHRcdFx0XHQvLyB9XHJcblxyXG5cclxuXHJcblx0XHRcdFx0dHlwZW9mIHRlbXBsYXRlX29iamVjdCA9PT0gXCJvYmplY3RcIiAmJiBPYmplY3Qua2V5cyh0ZW1wbGF0ZV9vYmplY3QpLmZvckVhY2goKGZ1bmN0aW9uKGtleSl7XHJcblx0XHRcdFx0XHQvLyBkZWxldGUgdGhpc1trZXldO1xyXG5cdFx0XHRcdFx0Ly8gdGhpc1trZXldID0gdGVtcGxhdGVfb2JqZWN0W2tleV07XHJcblx0XHRcdFx0XHQvLyBjb25zb2xlLmxvZyhcIlRoaXM6IFwiLCB0aGlzLCBrZXkpO1xyXG5cdFx0XHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsa2V5LHtcclxuXHRcdFx0XHRcdFx0dmFsdWU6IHRlbXBsYXRlX29iamVjdFtrZXldLFxyXG5cdFx0XHRcdFx0XHR3cml0YWJsZTogdHJ1ZVxyXG5cdFx0XHRcdFx0fSk7XHJcblx0XHRcdFx0fSkuYmluZCh0aGlzKSk7XHJcblxyXG4vLyBJZiB0aGlzIGZ1bmN0aW9uIGhhcyB0aGlzIGFyZ3VtZW50IHRoZW4gaXQgaGFzIGNvbWUgZnJvbSBhIGRpbGwtZm9yLlxyXG5cdFx0XHRcdGlmIChpbmRleCAhPT0gdW5kZWZpbmVkKSB7XHJcblx0XHRcdFx0XHR0aGlzLl9pdGVtID0gdGVtcGxhdGVfb2JqZWN0O1xyXG5cdFx0XHRcdFx0dGhpcy5faW5kZXggPSBpbmRleDtcclxuXHRcdFx0XHR9XHJcblxyXG4vLyBJZiBzY29wZSBpcyBub3QgaXNvbGF0ZWQgdGhlbiBhZGQgYSByZWZlcmVuY2UgdG8gdGhlIHBhcmVudCBkYXRhLlxyXG5cdFx0XHRcdGlmIChzY29wZSA9PT0gXCJub3JtYWxcIikge1xyXG5cdFx0XHRcdFx0dGhpcy5fZGlzcGxheSA9IHBhcmVudF9kYXRhO1xyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0Ly8gY29uc29sZS5sb2coXCJEYXRhOiBcIiwgdGhpcywgc2NvcGUsIGlucHV0KTtcclxuXHRcdFx0fTtcclxuXHJcbi8vIFNldCBkZWZhdWx0IHNjb2UgdG8gXCJub3JtYWxcIiBpZiB1bmRlZmluZWQuXHJcblx0XHRzY29wZSA9IHNjb3BlID09PSB1bmRlZmluZWQgfHwgc2NvcGUgIT09IFwiaXNvbGF0ZVwiXHJcblx0XHRcdD8gXCJub3JtYWxcIlxyXG5cdFx0XHQ6IHNjb3BlO1xyXG5cclxuLy8gSWYgc2NvcGUgaXMgbm90IGlzb2xhdGVkIHRoZW4gc2V0IHRoZSBwcm90b3R5cGUuIEluaGVyaXRpbmcgZnJvbSBkYXRhIHBhcmVudCBpcyB0aGUgZGVmYXVsdCBhbmQgaGFuZGxlZCBhdXRvbWF0aWNhbGx5IGluIEpTLlxyXG5cdFx0aWYgKHNjb3BlID09PSBcIm5vcm1hbFwiKSB7XHJcblx0XHRcdERhdGEucHJvdG90eXBlID0gcGFyZW50X2RhdGE7XHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIG5ldyBEYXRhKHRlbXBsYXRlX29iamVjdCk7XHJcblx0fVxyXG59KCkpO1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbihmdW5jdGlvbigpe1xyXG5cclxuXHR2YXIgZXh0ZW5kID0gZnVuY3Rpb24oZWxlLHNjb3BlLHZhbHVlKXtcclxuXHJcblx0XHQvLyBjb25zb2xlLmxvZyhcIkV4OiBcIiwgZWxlLCB2YWx1ZSk7XHJcblx0XHRpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkge1xyXG5cdFx0XHR0aHJvdyhcIk5vIHZhbHVlIGZvciBwcm9wZXJ0eSAnZGlsbC1leHRlbmRzJyBvbiBkaWxsLWV4dGVuZHM9XFxcIlwiICsgZWxlLmF0dHJpYnV0ZXNbXCJkaWxsLWV4dGVuZHNcIl0ubm9kZVZhbHVlICsgXCJcXFwiXCIpO1xyXG5cdFx0fVxyXG5cclxuXHRcdE9iamVjdC5rZXlzKHZhbHVlKS5mb3JFYWNoKGZ1bmN0aW9uKGtleSl7XHJcblx0XHRcdHZhciBwcm9wID0ga2V5LmNoYXJBdCgwKSA9PT0gXCJbXCIgJiYga2V5LmNoYXJBdChrZXkubGVuZ3RoLTEpID09PSBcIl1cIlxyXG5cdFx0XHRcdD8gXCI6XCIgKyBrZXkuc3Vic3RyaW5nKDEsa2V5Lmxlbmd0aC0xKVxyXG5cdFx0XHRcdDoga2V5LmNoYXJBdCgwKSA9PT0gXCIoXCIgJiYga2V5LmNoYXJBdChrZXkubGVuZ3RoLTEpID09PSBcIilcIlxyXG5cdFx0XHRcdFx0PyBrZXkuc3Vic3RyaW5nKDEsa2V5Lmxlbmd0aC0xKSArIFwiOlwiXHJcblx0XHRcdFx0XHQ6IGtleTtcclxuXHRcdFx0aWYgKGtleSA9PT0gXCJvbmluaXRcIikge1xyXG5cdFx0XHRcdHZhbHVlW2tleV0uYXBwbHkoc2NvcGUpO1xyXG5cdFx0XHRcdHJldHVybjtcclxuXHRcdFx0fVxyXG5cdFx0XHRlbGUuc2V0QXR0cmlidXRlKHByb3AsdmFsdWVba2V5XSk7XHJcblx0XHRcdC8vIGNvbnNvbGUubG9nKFwiRWFjaDogXCIsIGVsZSwgcHJvcCk7XHJcblx0XHR9KTtcclxuXHR9XHJcblxyXG5cdHdpbmRvdy5fZGlsbC5kaWxsX2V4dGVuZHMgPSBmdW5jdGlvbih0YXJnZXQsZGF0YSl7XHJcblx0XHRpZiAodGFyZ2V0Lmhhc0F0dHJpYnV0ZShcImRpbGwtZXh0ZW5kc1wiKSkge1xyXG5cdFx0XHRleHRlbmQodGFyZ2V0LGRhdGEsZGF0YVt0YXJnZXQuYXR0cmlidXRlc1tcImRpbGwtZXh0ZW5kc1wiXS5ub2RlVmFsdWVdKTtcclxuXHRcdFx0dGFyZ2V0LnJlbW92ZUF0dHJpYnV0ZShcImRpbGwtZXh0ZW5kc1wiKTtcclxuXHRcdH1cclxuXHR9XHJcbn0oKSk7XHJcbiIsIlxyXG5cInVzZSBzdHJpY3RcIjtcclxuXHJcbihmdW5jdGlvbigpe1xyXG5cclxuXHR3aW5kb3cuX2RpbGwudGVtcGxhdGVfZm9yID0gZnVuY3Rpb24odGFyZ2V0LHRlbXBsYXRlKXtcclxuXHRcdGlmICghdGFyZ2V0Lmhhc0F0dHJpYnV0ZShcImRpbGwtZm9yXCIpIHx8ICF0ZW1wbGF0ZS5kYXRhW3RhcmdldC5hdHRyaWJ1dGVzW1wiZGlsbC1mb3JcIl0ubm9kZVZhbHVlXSkge1xyXG5cdFx0XHRyZXR1cm47XHJcblx0XHR9XHJcblx0XHR2YXIgbGVuZ3RoID0gdGVtcGxhdGUuZGF0YVt0YXJnZXQuYXR0cmlidXRlc1tcImRpbGwtZm9yXCJdLm5vZGVWYWx1ZV0ubGVuZ3RoLFxyXG5cdFx0XHR2YWx1ZSA9IHRhcmdldC5hdHRyaWJ1dGVzW1wiZGlsbC1mb3JcIl0ubm9kZVZhbHVlLFxyXG5cdFx0XHRkYXRhO1xyXG5cdFx0ZGF0YSA9IHRoaXMuY3JlYXRlX2RhdGFfb2JqZWN0KHtcclxuXHRcdFx0dGVtcGxhdGVfb2JqZWN0OnRlbXBsYXRlLmRhdGFbdGFyZ2V0LmF0dHJpYnV0ZXNbXCJkaWxsLWZvclwiXS5ub2RlVmFsdWVdWzBdLFxyXG5cdFx0XHRwYXJlbnRfZGF0YTp0ZW1wbGF0ZS5kYXRhLFxyXG5cdFx0XHRpbmRleDowXHJcblx0XHR9KTtcclxuXHRcdHRlbXBsYXRlLmRhdGEgPSBkYXRhO1xyXG5cdFx0dGFyZ2V0LnJlbW92ZUF0dHJpYnV0ZShcImRpbGwtZm9yXCIpO1xyXG5cdFx0dGVtcGxhdGUuZm9yID0ge1xyXG5cdFx0XHRjbG9uZTogdGFyZ2V0LmNsb25lTm9kZSh0cnVlKSxcclxuXHRcdFx0aW5pdGlhbDogMSxcclxuXHRcdFx0Y3VycmVudHM6IGxlbmd0aCA+IDBcclxuXHRcdFx0XHQ/IFt0aGlzLmNyZWF0ZV90ZW1wbGF0ZSh0YXJnZXQsZGF0YSx0ZW1wbGF0ZS5tb2R1bGUpXVxyXG5cdFx0XHRcdDogW10sXHJcblx0XHRcdHZhbHVlOiB2YWx1ZVxyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0d2luZG93Ll9kaWxsLnJlbmRlcl9mb3IgPSBmdW5jdGlvbih0YXJnZXQsdGVtcGxhdGUpe1xyXG5cdFx0dmFyIHRhcmdldF9lbmRfZm9yID0gdGFyZ2V0LFxyXG5cdFx0XHRpLFxyXG5cdFx0XHRkYXRhLFxyXG5cdFx0XHRfdGVtcGxhdGUsXHJcblx0XHRcdGl0ZW1zID0gdGVtcGxhdGUuZGF0YVt0ZW1wbGF0ZS5mb3IudmFsdWVdO1xyXG5cclxuXHRcdC8vIGNvbnNvbGUubG9nKFwiSXRlbXM6IFwiLCBpdGVtcywgdGVtcGxhdGUpO1xyXG5cclxuXHRcdC8vIGlmICh0YXJnZXQubm9kZU5hbWUgPT09IFwiT1BUSU9OXCIpIHtcclxuXHRcdFx0Ly8gY29uc29sZS5sb2coXCJPcHRpb246IFwiLCB0ZW1wbGF0ZS5mb3IpO1xyXG5cdFx0XHQvLyBkZWJ1Z2dlcjtcclxuXHRcdC8vIH1cclxuXHJcbi8vIElmIHRoaXMgZm9yIGxvb3AgaGFzIGJlZW4gYmVoaW5kIGFuIGlmIHRvIGJlZ2luIHdpdGggdGhlbiBpdCB3aWxsIGhhdmUgYW4gaW5pdGlhbCBvZiAxIGJ1dCBubyBjdXJyZW50cy5cclxuLy8gVGhpcyBjYW4gYmUgZGlzY292ZXJlZCBhbmQgY29ycmVjdGVkIGJ5IGFkZGluZyBpbiB0aGUgbWlzc2luZyBjdXJyZW50IGZvciB0aGUgaW50aWFsIGJlbG93LlxyXG5cdFx0aWYgKHRlbXBsYXRlLmZvci5pbml0aWFsID09PSAxICYmIHRlbXBsYXRlLmZvci5jdXJyZW50cy5sZW5ndGggPT09IDApIHtcclxuXHRcdFx0dGVtcGxhdGUuZm9yLmN1cnJlbnRzLnB1c2godGhpcy5jcmVhdGVfdGVtcGxhdGUodGFyZ2V0X2VuZF9mb3IsdGVtcGxhdGUuZGF0YSx0ZW1wbGF0ZS5tb2R1bGUpKTtcclxuXHRcdH1cclxuXHJcblx0XHRpZiAodGVtcGxhdGUuZm9yLmluaXRpYWwgPCBpdGVtcy5sZW5ndGgpIHtcclxuXHRcdFx0Zm9yIChpPTE7aTx0ZW1wbGF0ZS5mb3IuaW5pdGlhbDtpKyspIHtcclxuXHRcdFx0XHR0YXJnZXRfZW5kX2ZvciA9IHRhcmdldF9lbmRfZm9yLm5leHRFbGVtZW50U2libGluZztcclxuXHRcdFx0fVxyXG5cdFx0XHRmb3IgKGk9dGVtcGxhdGUuZm9yLmluaXRpYWw7aTxpdGVtcy5sZW5ndGg7aSsrKSB7XHJcblx0XHRcdFx0aWYgKHRlbXBsYXRlLmZvci5pbml0aWFsID09PSAwICYmIGkgPT09IHRlbXBsYXRlLmZvci5pbml0aWFsKSB7XHJcblx0XHRcdFx0XHR0YXJnZXRfZW5kX2Zvci5wYXJlbnROb2RlLmluc2VydEJlZm9yZSh0ZW1wbGF0ZS5mb3IuY2xvbmUuY2xvbmVOb2RlKHRydWUpLCB0YXJnZXQpO1xyXG5cdFx0XHRcdFx0dGFyZ2V0X2VuZF9mb3IgPSB0YXJnZXQucHJldmlvdXNFbGVtZW50U2libGluZztcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0ZWxzZSB7XHJcblx0XHRcdFx0XHR0YXJnZXRfZW5kX2Zvci5pbnNlcnRBZGphY2VudEVsZW1lbnQoXCJhZnRlcmVuZFwiLCB0ZW1wbGF0ZS5mb3IuY2xvbmUuY2xvbmVOb2RlKHRydWUpKTtcclxuXHRcdFx0XHRcdHRhcmdldF9lbmRfZm9yID0gdGFyZ2V0X2VuZF9mb3IubmV4dEVsZW1lbnRTaWJsaW5nO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRkYXRhID0gdGhpcy5jcmVhdGVfZGF0YV9vYmplY3Qoe1xyXG5cdFx0XHRcdFx0dGVtcGxhdGVfb2JqZWN0Oml0ZW1zW2ldLFxyXG5cdFx0XHRcdFx0cGFyZW50X2RhdGE6dGVtcGxhdGUuZGF0YS5fZGlzcGxheSxcclxuXHRcdFx0XHRcdGluZGV4OmlcclxuXHRcdFx0XHR9KTtcclxuXHRcdFx0XHR0ZW1wbGF0ZS5kYXRhID0gZGF0YTtcclxuXHRcdFx0XHR0YXJnZXRfZW5kX2Zvci5yZW1vdmVBdHRyaWJ1dGUoXCJkaWxsLWZvclwiKTtcclxuXHRcdFx0XHRfdGVtcGxhdGUgPSB0aGlzLmNyZWF0ZV90ZW1wbGF0ZSh0YXJnZXRfZW5kX2Zvcix0ZW1wbGF0ZS5kYXRhLHRlbXBsYXRlLm1vZHVsZSk7XHJcblx0XHRcdFx0dGVtcGxhdGUuZm9yLmN1cnJlbnRzLnB1c2goX3RlbXBsYXRlKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0ZWxzZSBpZiAodGVtcGxhdGUuZm9yLmluaXRpYWwgPiBpdGVtcy5sZW5ndGgpIHtcclxuXHRcdFx0Zm9yIChpPTA7aTxpdGVtcy5sZW5ndGg7aSsrKSB7XHJcblx0XHRcdFx0dGFyZ2V0X2VuZF9mb3IgPSB0YXJnZXRfZW5kX2Zvci5uZXh0RWxlbWVudFNpYmxpbmc7XHJcblx0XHRcdH1cclxuXHRcdFx0Zm9yIChpPTA7aTx0ZW1wbGF0ZS5mb3IuaW5pdGlhbC1pdGVtcy5sZW5ndGg7aSsrKSB7XHJcblx0XHRcdFx0dGFyZ2V0X2VuZF9mb3IucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChcclxuXHRcdFx0XHRcdGkgPT09IHRlbXBsYXRlLmZvci5pbml0aWFsLWl0ZW1zLmxlbmd0aC0xXHJcblx0XHRcdFx0XHRcdD8gdGFyZ2V0X2VuZF9mb3JcclxuXHRcdFx0XHRcdFx0OiB0YXJnZXRfZW5kX2Zvci5uZXh0RWxlbWVudFNpYmxpbmdcclxuXHRcdFx0XHQpO1xyXG5cdFx0XHRcdHRlbXBsYXRlLmZvci5jdXJyZW50cy5wb3AoKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0dGFyZ2V0X2VuZF9mb3IgPSB0YXJnZXQ7XHJcblx0XHRpZiAodGVtcGxhdGUuZm9yLmluaXRpYWwgPT09IDApIHtcclxuXHRcdFx0Zm9yIChpPTA7aTxpdGVtcy5sZW5ndGg7aSsrKSB7XHJcblx0XHRcdFx0dGFyZ2V0X2VuZF9mb3IgPSB0YXJnZXRfZW5kX2Zvci5wcmV2aW91c0VsZW1lbnRTaWJsaW5nO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0Ly8gY29uc29sZS5sb2coXCJSZW5kZXIgZm9yOiBcIiwgdGVtcGxhdGUuZm9yLmluaXRpYWwsIHRlbXBsYXRlLmZvci5jdXJyZW50cy5sZW5ndGgsIHRlbXBsYXRlLmZvci5jdXJyZW50c1swXSAmJiB0ZW1wbGF0ZS5mb3IuY3VycmVudHNbMF0uZGF0YS5faXRlbSk7XHJcblxyXG5cdFx0dGVtcGxhdGUuZm9yLmluaXRpYWwgPSBpdGVtcy5sZW5ndGg7XHJcblx0XHRmb3IgKGk9MDtpPHRlbXBsYXRlLmZvci5pbml0aWFsO2krKykge1xyXG5cdFx0XHR0ZW1wbGF0ZS5mb3IuY3VycmVudHNbaV0uZGF0YS5faXRlbSA9IGl0ZW1zW2ldO1xyXG5cdFx0XHR0ZW1wbGF0ZS5mb3IuY3VycmVudHNbaV0uZGF0YS5faW5kZXggPSBpO1xyXG5cdFx0XHR0eXBlb2YgaXRlbXNbaV0gPT09IFwib2JqZWN0XCIgJiYgT2JqZWN0LmtleXMoaXRlbXNbaV0pLmZvckVhY2goZnVuY3Rpb24oa2V5KXtcclxuXHRcdFx0XHR0ZW1wbGF0ZS5mb3IuY3VycmVudHNbaV0uZGF0YVtrZXldID0gaXRlbXNbaV1ba2V5XTtcclxuXHRcdFx0fSk7XHJcblx0XHRcdC8vIGNvbnNvbGUubG9nKFwiRWFjaDogXCIsIHRhcmdldF9lbmRfZm9yLCB0ZW1wbGF0ZS5mb3IuY3VycmVudHNbaV0uZGF0YS5faXRlbSlcclxuXHRcdFx0dGhpcy5yZW5kZXJfZWxlbWVudCh0YXJnZXRfZW5kX2Zvcix0ZW1wbGF0ZS5mb3IuY3VycmVudHNbaV0pO1xyXG5cdFx0XHR0YXJnZXRfZW5kX2ZvciA9IHRhcmdldF9lbmRfZm9yLm5leHRFbGVtZW50U2libGluZztcclxuXHRcdH1cclxuXHRcdHJldHVybiB0ZW1wbGF0ZS5mb3IuaW5pdGlhbDtcclxuXHR9XHJcbn0oKSk7XHJcbiIsIlxyXG5cInVzZSBzdHJpY3RcIjtcclxuXHJcbihmdW5jdGlvbigpe1xyXG5cclxuXHR3aW5kb3cuX2RpbGwudGVtcGxhdGVfaWYgPSBmdW5jdGlvbih0YXJnZXQsdGVtcGxhdGUpe1xyXG5cdFx0aWYgKHRhcmdldC5oYXNBdHRyaWJ1dGUoXCJkaWxsLWlmXCIpKSB7XHJcblx0XHRcdHRlbXBsYXRlLmlmID0ge1xyXG5cdFx0XHRcdGVsZW1lbnQ6IHRhcmdldCxcclxuXHRcdFx0XHR2YWx1ZTogdGFyZ2V0LmF0dHJpYnV0ZXNbXCJkaWxsLWlmXCJdLm5vZGVWYWx1ZSxcclxuXHRcdFx0XHRpbml0aWFsOiB0cnVlLFxyXG5cdFx0XHRcdHBhcmVudDogdGFyZ2V0LnBhcmVudE5vZGVcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0d2luZG93Ll9kaWxsLnJlbmRlcl9pZiA9IGZ1bmN0aW9uKHRhcmdldCx0ZW1wbGF0ZSl7XHJcblx0XHR2YXIgaWZfdmFsdWUgPSB0aGlzLmRlYnJhY2VyKHRlbXBsYXRlLmlmLnZhbHVlLHRlbXBsYXRlLmRhdGEpO1xyXG5cdFx0Ly8gY29uc29sZS5sb2coXCJWYWx1ZSBpZjogXCIsIGlmX3ZhbHVlLCB0ZW1wbGF0ZS5pZi5pbml0aWFsKTtcclxuXHRcdGlmICghdGVtcGxhdGUuaWYuaW5pdGlhbCAmJiBpZl92YWx1ZSkge1xyXG5cdFx0XHRpZiAodGFyZ2V0ID09PSB1bmRlZmluZWQpIHtcclxuXHRcdFx0XHR0ZW1wbGF0ZS5pZi5wYXJlbnQuYXBwZW5kQ2hpbGQodGVtcGxhdGUuaWYuZWxlbWVudCk7XHJcblx0XHRcdH1cclxuXHRcdFx0ZWxzZSB7XHJcblx0XHRcdFx0dGFyZ2V0LnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKHRlbXBsYXRlLmlmLmVsZW1lbnQsdGFyZ2V0KTtcclxuXHRcdFx0fVxyXG5cdFx0XHR0YXJnZXQgPSB0ZW1wbGF0ZS5pZi5lbGVtZW50O1xyXG5cdFx0XHR0ZW1wbGF0ZS5pZi5pbml0aWFsID0gaWZfdmFsdWU7XHJcblx0XHR9XHJcblx0XHRlbHNlIGlmICh0ZW1wbGF0ZS5pZi5pbml0aWFsICYmICFpZl92YWx1ZSkge1xyXG5cdFx0XHR0YXJnZXQucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0YXJnZXQpO1xyXG5cdFx0XHR0ZW1wbGF0ZS5pZi5pbml0aWFsID0gaWZfdmFsdWU7XHJcblx0XHRcdHJldHVybiAwO1xyXG5cdFx0fVxyXG5cdFx0ZWxzZSBpZiAoIXRlbXBsYXRlLmlmLmluaXRpYWwgJiYgIWlmX3ZhbHVlKSB7XHJcblx0XHRcdHJldHVybiAwO1xyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIHRhcmdldDtcclxuXHR9XHJcblx0XHJcbn0oKSk7XHJcbiIsIlxyXG5cInVzZSBzdHJpY3RcIjtcclxuXHJcbihmdW5jdGlvbigpe1xyXG5cdHdpbmRvdy5fZGlsbC5mb3JfZWFjaCA9IGZ1bmN0aW9uKGxpc3QsY2FsbGJhY2spe1xyXG5cdFx0Zm9yICh2YXIgaT1saXN0Lmxlbmd0aC0xO2k+PTA7aS0tKSB7XHJcblx0XHRcdGNhbGxiYWNrKGxpc3RbaV0saSk7XHJcblx0XHR9XHJcblx0fVxyXG59KCkpO1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbihmdW5jdGlvbigpe1xyXG5cclxuXHR2YXIgcmVmID0gd2luZG93Ll9kaWxsO1xyXG5cdHZhciBNb2R1bGUgPSBmdW5jdGlvbihuYW1lLHNjb3BlLG1vZHVsZXMpe1xyXG5cdFx0dGhpcy5uYW1lID0gbmFtZTtcclxuXHRcdHRoaXMuY29tcG9uZW50cyA9IHt9O1xyXG5cdFx0dGhpcy5zZXJ2aWNlcyA9IHt9O1xyXG5cdFx0dGhpcy5lbGVtZW50cyA9IHt9O1xyXG5cdFx0bW9kdWxlcyAmJiBtb2R1bGVzLmZvckVhY2goZnVuY3Rpb24oeCl7XHJcblx0XHRcdHZhciBlbGVtZW50cztcclxuXHRcdFx0aWYgKHR5cGVvZiB4ID09PSBcInN0cmluZ1wiKSB7XHJcblx0XHRcdFx0eCA9IHNjb3BlLm1vZHVsZXNbeF07XHJcblx0XHRcdH1cclxuXHRcdFx0ZWxzZSBpZiAoISh4IGluc3RhbmNlb2YgTW9kdWxlKSkge1xyXG5cdFx0XHRcdHJldHVybjtcclxuXHRcdFx0fVxyXG5cdFx0XHRlbGVtZW50cyA9IE9iamVjdC5rZXlzKHguZWxlbWVudHMpO1xyXG5cdFx0XHRPYmplY3Qua2V5cyh4LmNvbXBvbmVudHMpLmZvckVhY2goZnVuY3Rpb24oY29tcG9uZW50KXtcclxuXHRcdFx0XHQvLyBjb25zb2xlLmxvZyhcIkNvcDogXCIsIGNvbXBvbmVudCwgeC5jb21wb25lbnRzW2NvbXBvbmVudF0pO1xyXG5cdFx0XHRcdGlmICh4LmNvbXBvbmVudHNbY29tcG9uZW50XS50eXBlID09PSBcImdsb2JhbFwiKSB7XHJcblx0XHRcdFx0XHR0aGlzLmNvbXBvbmVudHNbY29tcG9uZW50XSA9IHguY29tcG9uZW50c1tjb21wb25lbnRdO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fS5iaW5kKHRoaXMpKTtcclxuXHRcdFx0T2JqZWN0LmtleXMoeC5zZXJ2aWNlcykuZm9yRWFjaChmdW5jdGlvbihzZXJ2aWNlKXtcclxuXHRcdFx0XHR0aGlzLnNlcnZpY2VzW3NlcnZpY2VdID0geC5zZXJ2aWNlc1tzZXJ2aWNlXTtcclxuXHRcdFx0fS5iaW5kKHRoaXMpKTtcclxuXHRcdH0uYmluZCh0aGlzKSk7XHJcblx0fVxyXG5cdE1vZHVsZS5wcm90b3R5cGUgPSB7XHJcblx0XHRzZXRfY29tcG9uZW50OiBmdW5jdGlvbihjb21wb25lbnQsIHR5cGUpe1xyXG5cdFx0XHR0aGlzLmNvbXBvbmVudHNbY29tcG9uZW50Lm5hbWVdID0gY29tcG9uZW50O1xyXG5cdFx0fSxcclxuXHRcdHNldF9zZXJ2aWNlOiBmdW5jdGlvbihzZXJ2aWNlKXtcclxuXHRcdFx0dGhpcy5zZXJ2aWNlc1tzZXJ2aWNlLm5hbWVdID0gc2VydmljZS5kYXRhO1xyXG5cdFx0fSxcclxuXHRcdHNldF9lbGVtZW50OiBmdW5jdGlvbihuYW1lLGVsZW1lbnQpe1xyXG5cdFx0XHR0aGlzLmVsZW1lbnRzW25hbWVdID0gZWxlbWVudDtcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdHdpbmRvdy5fZGlsbC5Nb2R1bGUgPSBNb2R1bGU7XHJcblxyXG5cdHZhciBuZXdfbW9kdWxlID0gZnVuY3Rpb24oKXtcclxuXHRcdHZhciBNb2R1bGUgPSB3aW5kb3cuX2RpbGwuTW9kdWxlO1xyXG5cdFx0cmV0dXJuIGZ1bmN0aW9uKG5hbWUsc2NvcGUsbW9kdWxlcyl7XHJcblx0XHRcdHZhciBvdXRwdXQgPSBuZXcgTW9kdWxlKG5hbWUsc2NvcGUsbW9kdWxlcyk7XHJcblx0XHRcdE9iamVjdC5zZWFsKG91dHB1dCk7XHJcblx0XHRcdE9iamVjdC5mcmVlemUob3V0cHV0KTtcclxuXHRcdFx0cmV0dXJuIG91dHB1dDtcclxuXHRcdH1cclxuXHR9KCk7XHJcblxyXG5cdHdpbmRvdy5fZGlsbC5jcmVhdGVfbW9kdWxlID0gZnVuY3Rpb24obmFtZSxzY29wZSxtb2R1bGVzKXtcclxuXHRcdHJldHVybiBuZXdfbW9kdWxlKG5hbWUsc2NvcGUsbW9kdWxlcyk7XHJcblx0fVxyXG59KCkpO1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbihmdW5jdGlvbigpe1xyXG5cclxuXHQvLyB2YXIgcmVzb2x2ZV9vdXRwdXQgPSBmdW5jdGlvbigpe1xyXG5cdC8vIFx0dmFyIGJyYWNlciA9IHdpbmRvdy5fZGlsbC5icmFjZXI7XHJcblx0Ly8gXHRyZXR1cm4gZnVuY3Rpb24oZGF0YSl7XHJcblx0Ly8gXHRcdHZhciBvdXRwdXQgPSB0eXBlb2YgZGF0YSA9PT0gXCJmdW5jdGlvblwiXHJcblx0Ly8gXHRcdFx0PyBkYXRhLmFwcGx5KHRoaXMpXHJcblx0Ly8gXHRcdFx0OiBkYXRhO1xyXG5cdC8vIFx0XHRjb25zb2xlLmxvZyhcIk91dHB1dDogXCIsIG91dHB1dCk7XHJcblx0Ly8gXHRcdGlmIChvdXRwdXQgPT09IHVuZGVmaW5lZCkge1xyXG5cdC8vIFx0XHRcdHJldHVybiBcIlwiO1xyXG5cdC8vIFx0XHR9XHJcblx0Ly8gXHRcdGlmICh0eXBlb2Ygb3V0cHV0ICE9PSBcInN0cmluZ1wiKSB7XHJcblx0Ly8gXHRcdFx0cmV0dXJuIG91dHB1dDtcclxuXHQvLyBcdFx0fVxyXG5cdC8vIFx0XHRyZXR1cm4gYnJhY2VyKG91dHB1dCk7XHJcblx0Ly8gXHR9XHJcblx0Ly8gfSgpO1xyXG5cclxuXHR3aW5kb3cuX2RpbGwucmVuZGVyX2F0dHJpYnV0ZXMgPSBmdW5jdGlvbih0YXJnZXQsdGVtcGxhdGUpe1xyXG5cclxuXHRcdC8vIGNvbnNvbGUubG9nKFwiQXR0cmlidXRlczogXCIsIHRhcmdldCwgdGVtcGxhdGUpO1xyXG5cclxuXHRcdC8vIEFycmF5LnByb3RvdHlwZS5mb3JFYWNoLmFwcGx5KHRhcmdldC5hdHRyaWJ1dGVzLFtmdW5jdGlvbih4KXtcclxuXHRcdC8vIFx0eC5ub2RlVmFsdWUgPSB0aGlzLmJyYWNlcih4Lm5vZGVWYWx1ZSx0ZW1wbGF0ZS5kYXRhKTtcclxuXHRcdC8vIH0uYmluZCh0aGlzKV0pO1xyXG5cclxuXHJcblx0XHR0ZW1wbGF0ZS5hdHRyaWJ1dGVzICYmIHRlbXBsYXRlLmF0dHJpYnV0ZXMuZm9yRWFjaChmdW5jdGlvbih4KXtcclxuXHJcblx0XHRcdC8vIGNvbnNvbGUubG9nKFwiRWFjaDogXCIsIHgsIHRlbXBsYXRlKTtcclxuXHJcblxyXG5cdFx0XHR2YXIgdmFsdWUgPSB0eXBlb2YgdGVtcGxhdGUuZGF0YVt4LnZhbHVlXSA9PT0gXCJmdW5jdGlvblwiXHJcblx0XHRcdFx0PyB0ZW1wbGF0ZS5kYXRhW3gudmFsdWVdKClcclxuXHRcdFx0XHQ6IHRlbXBsYXRlLmRhdGFbeC52YWx1ZV07XHJcblxyXG5cdFx0XHRpZiAodGVtcGxhdGUuY29tcG9uZW50KSB7XHJcblx0XHRcdFx0Ly8gdGVtcGxhdGUuZGF0YVt4Lm5hbWVdID0geC50eXBlID09PSBcImJpbmRcIlxyXG5cdFx0XHRcdC8vIFx0PyB4LnZhbHVlXHJcblx0XHRcdFx0XHQvLyA6IHR5cGVvZiB0ZW1wbGF0ZS5kYXRhLl9kaXNwbGF5W3gudmFsdWVdID09PSBcImZ1bmN0aW9uXCJcclxuXHRcdFx0XHRcdC8vIFx0PyB0ZW1wbGF0ZS5kYXRhLl9kaXNwbGF5W3gudmFsdWVdKClcclxuXHRcdFx0XHRcdC8vIFx0OiB0ZW1wbGF0ZS5kYXRhLl9kaXNwbGF5W3gudmFsdWVdO1xyXG5cdFx0XHRcdFx0Ly8gOiByZXNvbHZlX291dHB1dC5hcHBseSh0ZW1wbGF0ZS5kYXRhLFt0ZW1wbGF0ZS5kYXRhLl9kaXNwbGF5W3gudmFsdWVdXSk7XHJcblx0XHRcdH1cclxuXHRcdFx0ZWxzZSBpZiAoeC5uYW1lICE9PSBcInZhbHVlXCIpIHtcclxuXHRcdFx0XHR0YXJnZXQuc2V0QXR0cmlidXRlKFxyXG5cdFx0XHRcdFx0eC5uYW1lLFxyXG5cdFx0XHRcdFx0Ly8gdHlwZW9mIHRlbXBsYXRlLmRhdGFbeC52YWx1ZV0gPT09IFwiZnVuY3Rpb25cIlxyXG5cdFx0XHRcdFx0Ly8gXHQ/IHRlbXBsYXRlLmRhdGFbeC52YWx1ZV0oKVxyXG5cdFx0XHRcdFx0Ly8gXHQ6IHRlbXBsYXRlLmRhdGFbeC52YWx1ZV1cclxuXHRcdFx0XHRcdC8vIHJlc29sdmVfb3V0cHV0LmFwcGx5KHRlbXBsYXRlLmRhdGEsW3RlbXBsYXRlLmRhdGFbeC52YWx1ZV1dKVxyXG5cdFx0XHRcdFx0eC50eXBlID09PSBcImxpdGVyYWxcIlxyXG5cdFx0XHRcdFx0XHQ/IHgudmFsdWVcclxuXHRcdFx0XHRcdFx0OiB4LnR5cGUgPT09IFwiYmluZFwiXHJcblx0XHRcdFx0XHRcdFx0Ly8gPyB0eXBlb2YgdGVtcGxhdGUuZGF0YVt4LnZhbHVlXSA9PT0gXCJmdW5jdGlvblwiXHJcblx0XHRcdFx0XHRcdFx0Ly8gXHQ/IHRlbXBsYXRlLmRhdGFbeC52YWx1ZV0oKVxyXG5cdFx0XHRcdFx0XHRcdC8vIFx0OiB0ZW1wbGF0ZS5kYXRhW3gudmFsdWVdXHJcblx0XHRcdFx0XHRcdFx0PyB2YWx1ZVxyXG5cdFx0XHRcdFx0XHRcdDogeC50eXBlID09PSBcImRlZmF1bHRcIlxyXG5cdFx0XHRcdFx0XHRcdFx0PyB0aGlzLmJyYWNlcih4LnZhbHVlLHRlbXBsYXRlLmRhdGEpXHJcblx0XHRcdFx0XHRcdFx0XHQ6IG51bGxcclxuXHJcblx0XHRcdFx0KTtcclxuXHRcdFx0fVxyXG5cdFx0XHRlbHNlIHtcclxuXHRcdFx0XHQvLyAoZnVuY3Rpb24oKXtcclxuXHRcdFx0XHRcdC8vIHZhciB2YWx1ZSA9IHR5cGVvZiB0ZW1wbGF0ZS5kYXRhW3gudmFsdWVdID09PSBcImZ1bmN0aW9uXCIgPyB0ZW1wbGF0ZS5kYXRhW3gudmFsdWVdKCkgOiB0ZW1wbGF0ZS5kYXRhW3gudmFsdWVdO1xyXG5cdFx0XHRcdFx0XHJcblx0XHRcdFx0XHQvLyBpZiAodGVtcGxhdGUudHlwZSA9PT0gXCJTRUxFQ1RcIikge1xyXG5cdFx0XHRcdFx0Ly8gXHRzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XHJcblx0XHRcdFx0XHQvLyBcdFx0Y29uc29sZS5sb2coXCJGR2V0OiBcIiwgdmFsdWUpO1xyXG5cdFx0XHRcdFx0Ly8gXHRcdHRhcmdldC52YWx1ZSA9IHZhbHVlO1xyXG5cdFx0XHRcdFx0Ly8gXHR9LDApO1xyXG5cdFx0XHRcdFx0Ly8gfVxyXG5cdFx0XHRcdFx0Ly8gZWxzZSB7XHJcblx0XHRcdFx0XHRcdHRhcmdldC52YWx1ZSA9IHZhbHVlO1xyXG5cdFx0XHRcdFx0Ly8gfVxyXG5cdFx0XHRcdC8vIH0oKSk7XHJcblx0XHRcdH1cclxuXHRcdH0uYmluZCh0aGlzKSk7XHJcblxyXG5cdFx0Ly8gdGVtcGxhdGUuYXR0cmlidXRlcyAmJiB0ZW1wbGF0ZS5hdHRyaWJ1dGVzLmZvckVhY2goZnVuY3Rpb24oeCl7XHJcblxyXG5cdFx0Ly8gXHQvLyBjb25zb2xlLmxvZyhcIlZhbHVlOiBcIiwgdmFsdWUsIHgsIHRhcmdldCk7XHJcblxyXG5cdFx0Ly8gXHRpZiAoeC50eXBlID09PSBcImJpbmRcIikge1xyXG5cdFx0Ly8gXHRcdHZhciB2YWx1ZSA9IHRoaXMuZGVicmFjZXIoeC52YWx1ZSx0ZW1wbGF0ZS5kYXRhKTtcclxuXHRcdC8vIFx0XHR0YXJnZXQuc2V0QXR0cmlidXRlKHgubmFtZSx2YWx1ZSk7XHJcblx0XHQvLyBcdFx0cmV0dXJuO1xyXG5cdFx0Ly8gXHR9XHJcblxyXG5cdFx0XHRcclxuXHRcdC8vIFx0dmFyIHZhbHVlID0gdGhpcy5icmFjZXIoeC52YWx1ZSx0ZW1wbGF0ZS5kYXRhKTtcclxuXHRcdC8vIFx0dGFyZ2V0LnNldEF0dHJpYnV0ZSh4Lm5hbWUsdmFsdWUpO1xyXG5cdFx0Ly8gXHRpZiAoeC5uYW1lID09PSBcInZhbHVlXCIpIHtcclxuXHRcdC8vIFx0XHRzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XHJcblx0XHQvLyBcdFx0XHRpZiAodmFsdWUgIT09IHVuZGVmaW5lZCkge1xyXG5cdFx0Ly8gXHRcdFx0XHR0YXJnZXQudmFsdWUgPSB2YWx1ZTtcclxuXHRcdC8vIFx0XHRcdH1cclxuXHRcdC8vIFx0XHR9LDApO1xyXG5cdFx0Ly8gXHR9XHJcblx0XHQvLyBcdGlmICghdmFsdWUpIHtcclxuXHRcdC8vIFx0XHR0YXJnZXQucmVtb3ZlQXR0cmlidXRlKHgubmFtZSk7XHJcblx0XHQvLyBcdH1cclxuXHRcdC8vIH0uYmluZCh0aGlzKSk7XHJcblxyXG5cclxuXHJcblx0fVxyXG59KCkpO1xyXG4iLCJcclxuXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG4oZnVuY3Rpb24oKXtcclxuXHJcblx0d2luZG93Ll9kaWxsLnJlbmRlcl9lbGVtZW50ID0gZnVuY3Rpb24odGFyZ2V0LHRlbXBsYXRlKXtcclxuXHRcdHZhciBpZl92YWx1ZTtcclxuXHJcblx0XHRpZiAodGVtcGxhdGUudHlwZSA9PT0gXCIjdGV4dFwiKSB7XHJcblx0XHRcdHRhcmdldC5ub2RlVmFsdWUgPSB0aGlzLmJyYWNlcih0ZW1wbGF0ZS52YWx1ZSx0ZW1wbGF0ZS5kYXRhKTtcclxuXHRcdFx0cmV0dXJuIDE7XHJcblx0XHR9XHJcblx0XHRpZiAodGVtcGxhdGUudHlwZSA9PT0gXCIjY29tbWVudFwiKSB7XHJcblx0XHRcdHJldHVybiAxO1xyXG5cdFx0fVxyXG5cdFx0XHJcblx0XHRpZiAodGVtcGxhdGUuaGFzT3duUHJvcGVydHkoXCJmb3JcIikpIHtcclxuXHRcdFx0cmV0dXJuIHRoaXMucmVuZGVyX2Zvcih0YXJnZXQsdGVtcGxhdGUpO1xyXG5cdFx0fVxyXG5cdFx0aWYgKHRlbXBsYXRlLmhhc093blByb3BlcnR5KFwiaWZcIikpIHtcclxuXHRcdFx0aWZfdmFsdWUgPSB0aGlzLnJlbmRlcl9pZih0YXJnZXQsdGVtcGxhdGUpO1xyXG5cdFx0XHRpZiAoaWZfdmFsdWUgPT09IDApIHtcclxuXHRcdFx0XHRyZXR1cm4gaWZfdmFsdWU7XHJcblx0XHRcdH1cclxuXHRcdFx0dGFyZ2V0ID0gaWZfdmFsdWU7XHJcblx0XHR9XHJcblx0XHRpZiAodGVtcGxhdGUudGVtcGxhdGUpIHtcclxuXHRcdFx0KGZ1bmN0aW9uKCl7XHJcblx0XHRcdFx0dmFyIF90ZW1wbGF0ZSA9IHRlbXBsYXRlLnRlbXBsYXRlO1xyXG5cdFx0XHRcdHRhcmdldC5pbm5lckhUTUwgPSB0eXBlb2YgX3RlbXBsYXRlID09PSBcImZ1bmN0aW9uXCIgPyBfdGVtcGxhdGUuYXBwbHkodGVtcGxhdGUuZGF0YSkgOiBfdGVtcGxhdGU7XHJcblx0XHRcdFx0dGVtcGxhdGUgPSB0aGlzLmNyZWF0ZV90ZW1wbGF0ZSh0YXJnZXQsdGVtcGxhdGUuZGF0YSx0ZW1wbGF0ZS5tb2R1bGUpO1xyXG5cdFx0XHRcdHRoaXMucmVuZGVyX2VsZW1lbnQodGFyZ2V0LHRlbXBsYXRlKTtcclxuXHRcdFx0XHR0ZW1wbGF0ZS50ZW1wbGF0ZSA9IF90ZW1wbGF0ZTtcclxuXHRcdFx0fS5hcHBseSh0aGlzKSk7XHJcblx0XHR9XHJcblx0XHR0aGlzLnJlbmRlcl9hdHRyaWJ1dGVzKHRhcmdldCx0ZW1wbGF0ZSk7XHJcblx0XHQvLyBjb25zb2xlLmxvZyhcIlJlbmRlcjogXCIsIHRhcmdldCwgdGVtcGxhdGUuZGF0YSk7XHJcblx0XHQvLyBpZiAodGFyZ2V0Lm5vZGVOYW1lID09PSBcIkxJXCIpIHtcclxuXHRcdC8vIFx0ZGVidWdnZXI7XHJcblx0XHQvLyB9XHJcblx0XHQoZnVuY3Rpb24oKXtcclxuXHRcdFx0dmFyIGluZGV4ID0gMDtcclxuXHRcdFx0dGVtcGxhdGUuY2hpbGRzICYmIHRlbXBsYXRlLmNoaWxkcy5mb3JFYWNoKChmdW5jdGlvbih4LGkpe1xyXG5cdFx0XHRcdGluZGV4ICs9IHRoaXMucmVuZGVyX2VsZW1lbnQodGFyZ2V0LmNoaWxkTm9kZXNbaW5kZXhdLHgpO1xyXG5cdFx0XHR9KS5iaW5kKHRoaXMpKTtcclxuXHRcdH0uYXBwbHkodGhpcykpO1xyXG5cdFx0cmV0dXJuIDE7XHJcblx0fVxyXG5cdFxyXG59KCkpO1xyXG4iLCJcclxuXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG4oZnVuY3Rpb24oKXtcclxuXHJcblx0dmFyIFNlcnZpY2UgPSBmdW5jdGlvbihuYW1lLGlucHV0KXtcclxuXHRcdHRoaXMubmFtZSA9IG5hbWU7XHJcblx0XHR0aGlzLmRhdGEgPSB0eXBlb2YgaW5wdXQgPT09IFwiZnVuY3Rpb25cIlxyXG5cdFx0XHQ/IChuZXcgaW5wdXQoKSlcclxuXHRcdFx0OiB0eXBlb2YgaW5wdXQgPT09IFwib2JqZWN0XCIgJiYgIUFycmF5LmlzQXJyYXkoaW5wdXQpXHJcblx0XHRcdFx0PyBpbnB1dFxyXG5cdFx0XHRcdDogbnVsbFxyXG5cdH1cclxuXHJcblx0d2luZG93Ll9kaWxsLlNlcnZpY2UgPSBTZXJ2aWNlO1xyXG5cclxuXHR3aW5kb3cuX2RpbGwuZ2VuZXJhdGVfc2VydmljZSA9IGZ1bmN0aW9uKG5hbWUsaW5wdXQpe1xyXG5cdFx0cmV0dXJuIG5ldyBTZXJ2aWNlKG5hbWUsaW5wdXQpO1xyXG5cdH07XHJcbn0oKSk7XHJcbiIsIlxyXG5cInVzZSBzdHJpY3RcIjtcclxuXHJcbihmdW5jdGlvbigpe1xyXG5cclxuXHR3aW5kb3cuX2RpbGwuY3JlYXRlX2F0dHJpYnV0ZXMgPSBmdW5jdGlvbih0YXJnZXQsdGVtcGxhdGUsbW9kdWxlLHBhcmVudF9kYXRhKXtcclxuXHRcdHZhciBvdXRwdXQgPSBbXTtcclxuXHRcdHRoaXMuZm9yX2VhY2godGFyZ2V0LmF0dHJpYnV0ZXMsZnVuY3Rpb24oYXR0cil7XHJcblx0XHRcdHZhciBuYW1lID0gYXR0ci5ub2RlTmFtZSxcclxuXHRcdFx0XHR2YWx1ZSA9IGF0dHIubm9kZVZhbHVlLFxyXG5cdFx0XHRcdGV2ZW50X25hbWUsXHJcblx0XHRcdFx0Zmlyc3QgPSBuYW1lLmNoYXJBdCgwKSxcclxuXHRcdFx0XHRsYXN0ID0gbmFtZS5jaGFyQXQobmFtZS5sZW5ndGgtMSksXHJcblx0XHRcdFx0Zmlyc3RfdHdvID0gbmFtZS5zdWJzdHIoMCwyKSxcclxuXHRcdFx0XHRsYXN0X3R3byA9IG5hbWUuc3Vic3RyKG5hbWUubGVuZ3RoLTIsMiksXHJcblx0XHRcdFx0bGl0ZXJhbCA9IHZhbHVlLmNoYXJBdCgwKSA9PT0gXCInXCIgJiYgdmFsdWUuY2hhckF0KHZhbHVlLmxlbmd0aC0xLDEpID09PSBcIidcIixcclxuXHRcdFx0XHRyZW1vdmVfYXR0cmlidXRlID0gZnVuY3Rpb24oKXtcclxuXHRcdFx0XHRcdHRhcmdldC5yZW1vdmVBdHRyaWJ1dGUobmFtZSk7XHJcblx0XHRcdFx0fSxcclxuXHRcdFx0XHRkZWZpbmUgPSBmdW5jdGlvbihuYW1lLGdldHRlciwgc2V0dGVyKXtcclxuXHRcdFx0XHRcdHZhciBjb25zdHJ1Y3QgPSB7fTtcclxuXHRcdFx0XHRcdGlmIChnZXR0ZXIpe1xyXG5cdFx0XHRcdFx0XHRjb25zdHJ1Y3QuZ2V0ID0gZnVuY3Rpb24oKXtcclxuXHRcdFx0XHRcdFx0XHRyZXR1cm4gcGFyZW50X2RhdGFbdmFsdWVdO1xyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRpZiAoc2V0dGVyKSB7XHJcblx0XHRcdFx0XHRcdGNvbnN0cnVjdC5zZXQgPSBmdW5jdGlvbihpbnB1dCl7XHJcblx0XHRcdFx0XHRcdFx0ZGlsbC5idWJibGVfY2hhbmdlKHBhcmVudF9kYXRhLHZhbHVlLGlucHV0KTtcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KHRlbXBsYXRlLmRhdGEsbmFtZSxjb25zdHJ1Y3QpO1xyXG5cdFx0XHRcdH07XHJcblxyXG5cdFx0Ly8gSWYgYXR0cmlidXRlIHN0YXJ0cyB3aXRoIGhhc2ggdGhlbiBzYXZlIHRoaXMgZWxlbWVudCB0byB0aGUgbW9kdWxlLlxyXG5cdFx0XHRpZiAobmFtZS5jaGFyQXQoMCkgPT09IFwiI1wiKSB7XHJcblx0XHRcdFx0bW9kdWxlLnNldF9lbGVtZW50KG5hbWUuc3Vic3RyaW5nKDEsbmFtZS5sZW5ndGgpLHRhcmdldCk7XHJcblx0XHRcdFx0Ly8gdGVtcGxhdGUuZGF0YS5fZWxlbWVudHNbbmFtZS5zdWJzdHJpbmcoMSxuYW1lLmxlbmd0aCldID0gdGFyZ2V0O1xyXG5cdFx0XHRcdC8vIGNvbnNvbGUubG9nKFwiSWQ6IFwiLCBuYW1lLCB0YXJnZXQsIHRlbXBsYXRlLmRhdGEuX2VsZW1lbnRzKTtcclxuXHRcdFx0XHRyZXR1cm4gcmVtb3ZlX2F0dHJpYnV0ZSgpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0Ly8gRm9ybSBmaWVsZHMgaGF2ZSBhIHZhbHVlIHByb3BlcnR5IHdoaWNoIGlzIGhhcmRlciB0byBzZXQuXHJcblx0XHQvLyBJbnN0ZWFkIG9mIGRvaW5nIFt2YWx1ZV09XCJ2YWx1ZVwiIChpbnB1dCk9XCJ1cGRhdGVcIiB1cGRhdGU6IGZ1bmN0aW9uKGUpeyB0aGlzLmJ1YmJsZV9jaGFuZ2UodGhpcyxcInZhbHVlXCIsZS50YXJnZXQudmFsdWUpfS5cclxuXHRcdC8vIEp1c3QgZG8gWyh2YWx1ZSldPVwidmFsdWVcIlxyXG5cdFx0XHRpZiAobmFtZSA9PT0gXCJbKHZhbHVlKV1cIiB8fCBuYW1lID09PSBcIjp2YWx1ZTpcIikge1xyXG5cdFx0XHRcdC8vIG91dHB1dC5wdXNoKHtcclxuXHRcdFx0XHQvLyBcdG5hbWU6IFwidmFsdWVcIixcclxuXHRcdFx0XHQvLyBcdHZhbHVlOiB2YWx1ZVxyXG5cdFx0XHRcdC8vIH0pO1xyXG5cdFx0XHRcdC8vIHRhcmdldC52YWx1ZSA9IHRlbXBsYXRlLmRhdGFbdmFsdWVdID8gdGVtcGxhdGUuZGF0YVt2YWx1ZV0gOiBcIlwiIDtcclxuXHRcdFx0XHR0YXJnZXQuYWRkRXZlbnRMaXN0ZW5lcihcImlucHV0XCIsZnVuY3Rpb24oKXtcclxuXHRcdFx0XHRcdHRlbXBsYXRlLmRhdGFbdmFsdWVdID0gdGFyZ2V0LnZhbHVlO1xyXG5cdFx0XHRcdFx0ZGlsbC5jaGFuZ2UoKTtcclxuXHRcdFx0XHR9LmJpbmQodGhpcykpO1xyXG5cdFx0XHRcdC8vIHJldHVybiByZW1vdmVfYXR0cmlidXRlKCk7XHJcblxyXG5cdFx0XHRcdHRhcmdldC5zZXRBdHRyaWJ1dGUoXCI6dmFsdWVcIix2YWx1ZSk7XHJcblx0XHRcdFx0cmVtb3ZlX2F0dHJpYnV0ZSgpO1xyXG5cdFx0XHR9XHJcblxyXG5cclxuXHRcdFx0aWYgKCAoZmlyc3RfdHdvID09PSBcIlsoXCIgJiYgbGFzdF90d28gPT09IFwiKV1cIikgfHwgZmlyc3QgPT09IFwiOlwiICYmIGxhc3QgPT09IFwiOlwiICkge1xyXG5cdFx0XHRcdGlmICh0ZW1wbGF0ZS5jb21wb25lbnQpIHtcclxuXHRcdFx0XHRcdGRlZmluZShuYW1lLnN1YnN0cmluZygyLG5hbWUubGVuZ3RoLTIpLHRydWUsdHJ1ZSk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdC8vIGVsc2Uge1xyXG5cdFx0XHRcdC8vIFx0b3V0cHV0LnB1c2goe1xyXG5cdFx0XHRcdC8vIFx0XHRuYW1lOiBuYW1lLnN1YnN0cmluZygxLG5hbWUubGVuZ3RoLShmaXJzdCAhPT0gXCI6XCIpKSxcclxuXHRcdFx0XHQvLyBcdFx0dmFsdWU6IHZhbHVlXHJcblx0XHRcdFx0Ly8gXHR9KTtcclxuXHRcdFx0XHQvLyB9XHJcblx0XHRcdFx0cmV0dXJuIHJlbW92ZV9hdHRyaWJ1dGUoKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdC8vIElmIGF0dHJpYnV0ZSBpcyBiaW5kYWJsZSAoc3Vycm91bmRlZCBieSBzcXVhcmUgYnJhY2tldHMgb3Igc3RhcnRlZCB3aXRoIDopIHRoZW4gc2F2ZSB0aGlzIHRvIHRoZSB0ZW1wbGF0ZS5cclxuXHRcdC8vIFNxdWFyZSBicmFja2V0IG5vdGF0aW9uIGlzIG5vdCB2YWxpZCBzeW50YXggd2hlbiBzZXR0aW5nIGF0dHJpYnV0ZXMgc28gdXNlIDogaW5zdGVhZC5cclxuXHRcdC8vIFNxdWFyZSBicmFja2V0cyBtYWtlIGRldmVsb3BpbmcgZWFzaWVyIGFzIHRoZSBsb2dpYyBpcyBlYXNpZXIgdG8gc2VlLlxyXG5cdFx0XHRpZiAoIChmaXJzdCA9PT0gXCJbXCIgJiYgbGFzdCA9PT0gXCJdXCIpIHx8IGZpcnN0ID09PSBcIjpcIiApIHtcclxuXHRcdFx0XHRpZiAodGVtcGxhdGUuY29tcG9uZW50KSB7XHJcblx0XHRcdFx0XHRkZWZpbmUobmFtZS5zdWJzdHJpbmcoMSxuYW1lLmxlbmd0aC0xKSx0cnVlLGZhbHNlKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0ZWxzZSB7XHJcblx0XHRcdFx0XHRvdXRwdXQucHVzaCh7XHJcblx0XHRcdFx0XHRcdG5hbWU6IG5hbWUuc3Vic3RyaW5nKDEsbmFtZS5sZW5ndGgtKGZpcnN0ICE9PSBcIjpcIikpLFxyXG5cdFx0XHRcdFx0XHR2YWx1ZTogbGl0ZXJhbFxyXG5cdFx0XHRcdFx0XHRcdD8gdmFsdWUuc3Vic3RyaW5nKDEsdmFsdWUubGVuZ3RoLTEpXHJcblx0XHRcdFx0XHRcdFx0OiB2YWx1ZSxcclxuXHRcdFx0XHRcdFx0dHlwZTogbGl0ZXJhbFxyXG5cdFx0XHRcdFx0XHRcdD8gXCJsaXRlcmFsXCJcclxuXHRcdFx0XHRcdFx0XHQ6IFwiYmluZFwiXHJcblx0XHRcdFx0XHR9KTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0cmV0dXJuIHJlbW92ZV9hdHRyaWJ1dGUoKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdC8vIElmIHRoZSBhdHRyaWJ1dGUgaXMgc3Vycm91bmRlZCBieSBwYXJlbnRoZXNpcyAoIChhKSApLCBvciBlbmRzIHdpdGggOiB0aGVuIGFzc2lnbiBhIG5hbWUgYXMgYW4gZXZlbnQgbGlzdGVuZXIuXHJcblx0XHRcdGlmICggKGZpcnN0ID09PSBcIihcIiAmJiBsYXN0ID09PSBcIilcIikgfHwgbGFzdCA9PT0gXCI6XCIgKSB7XHJcblx0XHRcdFx0aWYgKHRlbXBsYXRlLmNvbXBvbmVudCkge1xyXG5cdFx0XHRcdFx0ZGVmaW5lKG5hbWUuc3Vic3RyaW5nKDEsbmFtZS5sZW5ndGgtMSksZmFsc2UsdHJ1ZSk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGVsc2Uge1xyXG5cdFx0XHRcdFx0ZXZlbnRfbmFtZSA9IG5hbWUuc3Vic3RyaW5nKGxhc3QgPT09IFwiOlwiID8gMCA6IDEsbmFtZS5sZW5ndGgtMSk7XHJcblx0XHRcdFx0XHR0YXJnZXQuYWRkRXZlbnRMaXN0ZW5lcihldmVudF9uYW1lLGZ1bmN0aW9uKGV2ZW50KXtcclxuXHRcdFx0XHRcdFx0dmFyIHJldHVybnM7XHJcblx0XHRcdFx0XHRcdGlmICh0ZW1wbGF0ZS5kYXRhW3ZhbHVlXSA9PT0gdW5kZWZpbmVkKSB7XHJcblx0XHRcdFx0XHRcdFx0ZGlsbC5jaGFuZ2UoKTtcclxuXHRcdFx0XHRcdFx0XHRyZXR1cm47XHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0cmV0dXJucyA9IHRlbXBsYXRlLmRhdGFbdmFsdWVdLmFwcGx5KHRlbXBsYXRlLmRhdGEsW2V2ZW50LHRhcmdldF0pO1xyXG5cdFx0XHRcdFx0XHRpZiAocmV0dXJucyA9PT0gZmFsc2UpIHtcclxuXHRcdFx0XHRcdFx0XHRyZXR1cm47XHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0ZGlsbC5jaGFuZ2UoKTtcclxuXHRcdFx0XHRcdH0pO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRyZXR1cm4gcmVtb3ZlX2F0dHJpYnV0ZSgpO1xyXG5cdFx0XHR9XHJcblxyXG5cclxuXHRcdFx0ZWxzZSBpZiAobmFtZS5zdWJzdHIoMCw1KSAhPT0gXCJkaWxsLVwiKSB7XHJcblx0XHRcdFx0aWYgKHRlbXBsYXRlLmNvbXBvbmVudCkge1xyXG5cdFx0XHRcdFx0Ly8gY29uc29sZS5sb2coXCJBdHRyaWJ1dGU6IFwiLCBuYW1lLCB2YWx1ZSwgdGVtcGxhdGUuZGF0YSk7XHJcblx0XHRcdFx0XHR0ZW1wbGF0ZS5kYXRhW25hbWVdID0gcGFyZW50X2RhdGFbdmFsdWVdO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRlbHNlIHtcclxuXHRcdFx0XHRcdG91dHB1dC5wdXNoKHtcclxuXHRcdFx0XHRcdFx0bmFtZTogbmFtZSxcclxuXHRcdFx0XHRcdFx0dmFsdWU6IGxpdGVyYWxcclxuXHRcdFx0XHRcdFx0XHQ/IHZhbHVlLnN1YnN0cmluZygxLHZhbHVlLmxlbmd0aC0xKVxyXG5cdFx0XHRcdFx0XHRcdDogdmFsdWUsXHJcblx0XHRcdFx0XHRcdHR5cGU6IGxpdGVyYWxcclxuXHRcdFx0XHRcdFx0XHQ/IFwibGl0ZXJhbFwiXHJcblx0XHRcdFx0XHRcdFx0OiBcImRlZmF1bHRcIlxyXG5cdFx0XHRcdFx0fSk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHQvLyBlbHNlIGlmIChuYW1lLnN1YnN0cigwLDUpICE9PSBcImRpbGwtXCIpIHtcclxuXHRcdFx0Ly8gXHRvdXRwdXQucHVzaCh7XHJcblx0XHRcdC8vIFx0XHRuYW1lOiBuYW1lLFxyXG5cdFx0XHQvLyBcdFx0dmFsdWU6IHZhbHVlXHJcblx0XHRcdC8vIFx0fSk7XHJcblx0XHRcdC8vIH1cclxuXHJcblxyXG5cdFx0fS5iaW5kKHRoaXMpKTtcclxuXHRcdHJldHVybiBvdXRwdXQ7XHJcblx0fVxyXG5cdFxyXG59KCkpO1xyXG4iLCJcclxuXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG4oZnVuY3Rpb24oKXtcclxuXHJcblx0d2luZG93Ll9kaWxsLnRlbXBsYXRlX2NvbXBvbmVudCA9IGZ1bmN0aW9uKHRhcmdldCx0ZW1wbGF0ZSxtb2R1bGUpe1xyXG5cclxuXHJcbi8vIENoZWNrIHRoYXQgdG8gc2VlIGlmIHRoaXMgZWxlbWVudCBpcyBhY3R1YWxseSBhIGNvbXBvbmVudCBvbiB0aGlzIG1vZHVsZSwgaWYgbm90IHRoZW4gcmV0dXJuIHVuZGVmaW5lZCBhbmQgZG8gbm90IHByb2Nlc3MgZWxlbWVudCBhcyBhIGNvbXBvbmVudC5cclxuXHRcdHZhciBjdXJyZW50X2NvbXBvbmVudCA9IG1vZHVsZS5jb21wb25lbnRzW3RhcmdldC5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpXTtcclxuXHRcdGlmICghY3VycmVudF9jb21wb25lbnQpIHtcclxuXHRcdFx0cmV0dXJuO1xyXG5cdFx0fVxyXG5cclxuXHJcblxyXG5cclxuXHRcdHRlbXBsYXRlLmNvbXBvbmVudCA9IHRydWU7XHJcblxyXG5cclxuXHJcblxyXG5cclxuXHRcdC8vIGlmICh0eXBlb2YgY3VycmVudF9jb21wb25lbnQuZGF0YSA9PT0gXCJvYmplY3RcIikge1xyXG5cdFx0Ly8gXHR0ZW1wbGF0ZS5kYXRhID0gdGhpcy5jcmVhdGVfZGF0YV9vYmplY3Qoe1xyXG5cdFx0Ly8gXHRcdHRlbXBsYXRlX29iamVjdDpjdXJyZW50X2NvbXBvbmVudC5kYXRhLFxyXG5cdFx0Ly8gXHRcdHBhcmVudF9kYXRhOnRlbXBsYXRlLmRhdGEsXHJcblx0XHQvLyBcdFx0c2NvcGU6dGFyZ2V0Lmhhc0F0dHJpYnV0ZShcImRpbGwtc2NvcGVcIilcclxuXHRcdC8vIFx0XHRcdD8gdGFyZ2V0LmF0dHJpYnV0ZXNbXCJkaWxsLXNjb3BlXCJdLm5vZGVWYWx1ZVxyXG5cdFx0Ly8gXHRcdFx0OiB1bmRlZmluZWRcclxuXHRcdC8vIFx0fSk7XHJcblx0XHQvLyB9XHJcblx0XHQvLyBlbHNlIFxyXG5cdFx0XHRpZiAodHlwZW9mIGN1cnJlbnRfY29tcG9uZW50LmRhdGEgPT09IFwiZnVuY3Rpb25cIikge1xyXG5cdFx0XHQvLyB0ZW1wbGF0ZS5kYXRhID0gbmV3IGN1cnJlbnRfY29tcG9uZW50LmRhdGEoKTtcclxuXHRcdFx0Ly8gKGZ1bmN0aW9uKCl7XHJcblx0XHRcdC8vIFx0dmFyIF9kYXRhID0gbmV3IGN1cnJlbnRfY29tcG9uZW50LmRhdGEoKTtcclxuXHRcdFx0Ly8gXHR0ZW1wbGF0ZS5kYXRhID0gdGhpcy5jcmVhdGVfZGF0YV9vYmplY3Qoe1xyXG5cdFx0XHQvLyBcdFx0dGVtcGxhdGVfb2JqZWN0Ol9kYXRhLFxyXG5cdFx0XHQvLyBcdFx0cGFyZW50X2RhdGE6dGVtcGxhdGUuZGF0YSxcclxuXHRcdFx0Ly8gXHRcdHNjb3BlOnRhcmdldC5oYXNBdHRyaWJ1dGUoXCJkaWxsLXNjb3BlXCIpXHJcblx0XHRcdC8vIFx0XHRcdD8gdGFyZ2V0LmF0dHJpYnV0ZXNbXCJkaWxsLXNjb3BlXCJdLm5vZGVWYWx1ZVxyXG5cdFx0XHQvLyBcdFx0XHQ6IHVuZGVmaW5lZFxyXG5cdFx0XHQvLyBcdH0pO1xyXG5cdFx0XHQvLyB9LmFwcGx5KHRoaXMpKTtcclxuXHJcblx0XHRcdGN1cnJlbnRfY29tcG9uZW50LmRhdGEgPSBuZXcgY3VycmVudF9jb21wb25lbnQuZGF0YSgpO1xyXG5cclxuXHJcblxyXG5cdFx0fVxyXG5cclxuXHRcdC8vIGNvbnNvbGUubG9nKFwiQ29tcG9uZW50IDE6IFwiLCBjdXJyZW50X2NvbXBvbmVudCwgdGVtcGxhdGUuZGF0YSk7XHJcblxyXG5cclxuXHRcdHRlbXBsYXRlLmRhdGEgPSB0aGlzLmNyZWF0ZV9kYXRhX29iamVjdCh7XHJcblx0XHRcdHRlbXBsYXRlX29iamVjdDpjdXJyZW50X2NvbXBvbmVudC5kYXRhLFxyXG5cdFx0XHRwYXJlbnRfZGF0YTp0ZW1wbGF0ZS5kYXRhLFxyXG5cdFx0XHRzY29wZTp0YXJnZXQuaGFzQXR0cmlidXRlKFwiZGlsbC1zY29wZVwiKVxyXG5cdFx0XHRcdD8gdGFyZ2V0LmF0dHJpYnV0ZXNbXCJkaWxsLXNjb3BlXCJdLm5vZGVWYWx1ZVxyXG5cdFx0XHRcdDogdW5kZWZpbmVkXHJcblx0XHR9KTtcclxuXHJcblxyXG5cdFx0dGVtcGxhdGUuZGF0YS5fdGVtcGxhdGUgPSB0YXJnZXQuaW5uZXJIVE1MO1xyXG5cdFx0dGFyZ2V0LmlubmVySFRNTCA9IGN1cnJlbnRfY29tcG9uZW50LnRlbXBsYXRlO1xyXG5cclxuXHRcdC8vIGNvbnNvbGUubG9nKFwiQ29tcG9uZW50IDI6IFwiLCB0ZW1wbGF0ZSk7XHJcblxyXG5cclxuXHJcblxyXG5cdFx0Ly8gaWYgKHRlbXBsYXRlLmRhdGEuaGFzT3duUHJvcGVydHkoXCJvbmluaXRcIikpIHtcclxuXHRcdC8vIFx0dGVtcGxhdGUuZGF0YS5vbmluaXQoKTtcclxuXHRcdC8vIH1cclxuXHJcblxyXG5cclxuXHJcblx0XHRpZiAoY3VycmVudF9jb21wb25lbnQuaGFzT3duUHJvcGVydHkoXCJtb2R1bGVcIikpIHtcclxuXHRcdFx0cmV0dXJuIGN1cnJlbnRfY29tcG9uZW50Lm1vZHVsZTtcclxuXHRcdH1cclxuXHJcblxyXG5cclxuXHJcblxyXG5cdH1cclxuXHJcblx0Ly8gd2luZG93Ll9kaWxsLmNvbXBvbmVudF9hdHRyaWJ1dGVzID0gZnVuY3Rpb24odGFyZ2V0LHRlbXBsYXRlKXtcclxuXHQvLyBcdHRoaXMuZm9yX2VhY2godGFyZ2V0LmF0dHJpYnV0ZXMsZnVuY3Rpb24oYXR0cil7XHJcblx0Ly8gXHRcdHZhciBuYW1lID0gYXR0ci5ub2RlTmFtZSxcclxuXHQvLyBcdFx0XHR2YWx1ZSxcclxuXHQvLyBcdFx0XHRsLFxyXG5cdC8vIFx0XHRcdGZpcnN0ID0gbmFtZS5jaGFyQXQoMCksXHJcblx0Ly8gXHRcdFx0bGFzdCA9IG5hbWUuY2hhckF0KG5hbWUubGVuZ3RoLTEpO1xyXG5cdC8vIFx0XHRpZiAoICEoIChmaXJzdCA9PT0gXCJbXCIgJiYgbGFzdCA9PT0gXCJdXCIpIHx8IGZpcnN0ID09PSBcIjpcIiApICkge1xyXG5cdC8vIFx0XHRcdHJldHVybjtcclxuXHQvLyBcdFx0fVxyXG5cdC8vIFx0XHR2YWx1ZSA9IGF0dHIubm9kZVZhbHVlO1xyXG5cdC8vIFx0XHRsID0gdmFsdWUubGVuZ3RoO1xyXG5cdC8vIFx0XHR2YWx1ZSA9ICh2YWx1ZS5jaGFyQXQoMCkgPT09IFwiJ1wiICYmIHZhbHVlLnN1YnN0cihsLTEsbCkgPT09IFwiJ1wiKVxyXG5cdC8vIFx0XHRcdD8gdmFsdWUuc3Vic3RyaW5nKDEsbC0xKSA9PT0gXCJ0cnVlXCJcclxuXHQvLyBcdFx0XHRcdD8gdHJ1ZVxyXG5cdC8vIFx0XHRcdFx0OiB2YWx1ZS5zdWJzdHJpbmcoMSxsLTEpID09PSBcImZhbHNlXCJcclxuXHQvLyBcdFx0XHRcdFx0PyBmYWxzZVxyXG5cdC8vIFx0XHRcdFx0XHQ6IHZhbHVlLnN1YnN0cmluZygxLGwtMSlcclxuXHQvLyBcdFx0XHQ6IHRlbXBsYXRlLmRhdGEuX2Rpc3BsYXlbdmFsdWVdO1xyXG5cdC8vIFx0XHRuYW1lID0gbmFtZS5zdWJzdHJpbmcoMSxuYW1lLmxlbmd0aC0oZmlyc3QgIT09IFwiOlwiKSk7XHJcblx0Ly8gXHRcdHRlbXBsYXRlLmRhdGFbbmFtZV0gPSB2YWx1ZTtcclxuXHQvLyBcdH0pO1xyXG5cdC8vIH1cclxuXHJcbn0oKSk7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxuKGZ1bmN0aW9uKCl7XHJcblx0d2luZG93Ll9kaWxsLmRpbGxfdGVtcGxhdGUgPSBmdW5jdGlvbih0YXJnZXQsdGVtcGxhdGUpe1xyXG5cdFx0dmFyIF90ZW1wbGF0ZSxcclxuXHRcdFx0dmFsdWU7XHJcblx0XHRpZiAodGFyZ2V0Lmhhc0F0dHJpYnV0ZShcImRpbGwtdGVtcGxhdGVcIikpIHtcclxuXHJcblxyXG5cdFx0XHQvLyBjb25zb2xlLmxvZyhcIlRlbXBsYXRlOiBcIiwgdGFyZ2V0LCB0ZW1wbGF0ZS5kYXRhKTtcclxuXHJcblx0XHRcdC8vIF90ZW1wbGF0ZSA9IHRhcmdldC5pbm5lckhUTUw7XHJcblx0XHRcdHZhbHVlID0gdGVtcGxhdGUuZGF0YVt0YXJnZXQuYXR0cmlidXRlc1tcImRpbGwtdGVtcGxhdGVcIl0ubm9kZVZhbHVlXTtcclxuXHRcdFx0Ly8gdmFsdWUgPSB0eXBlb2YgdmFsdWUgPT09IFwiZnVuY3Rpb25cIiA/IHZhbHVlLmFwcGx5KHRlbXBsYXRlLmRhdGEpIDogdmFsdWU7XHJcblx0XHRcdC8vIGlmICh2YWx1ZSAhPT0gZmFsc2UpIHtcclxuXHRcdFx0Ly8gXHR0YXJnZXQuaW5uZXJIVE1MID0gdmFsdWU7XHJcblx0XHRcdC8vIH1cclxuXHRcdFx0Ly8gdGVtcGxhdGUuZGF0YS5fdGVtcGxhdGUgPSBfdGVtcGxhdGU7XHJcblx0XHRcdHRlbXBsYXRlLnRlbXBsYXRlID0gdmFsdWU7XHJcblx0XHRcdHRhcmdldC5yZW1vdmVBdHRyaWJ1dGUoXCJkaWxsLXRlbXBsYXRlXCIpO1xyXG5cclxuXHJcblxyXG5cdFx0fVxyXG5cdH1cclxufSgpKTtcclxuIiwiXHJcblwidXNlIHN0cmljdFwiO1xyXG5cclxuKGZ1bmN0aW9uKCl7XHJcblxyXG5cdHZhciByZW5kZXJzID0gW10sXHJcblx0XHRyZWYgPSB3aW5kb3cuX2RpbGwsXHJcblx0XHREaWxsID0gZnVuY3Rpb24oKXtcclxuXHRcdFx0dGhpcy5tb2R1bGVzID0ge307XHJcblx0XHRcdHRoaXMubW9kdWxlID0gZnVuY3Rpb24obmFtZSxtb2R1bGVzKXtcclxuXHRcdFx0XHRpZiAodGhpcy5tb2R1bGVzW25hbWVdKSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gdGhpcy5tb2R1bGVzW25hbWVdO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHR0aGlzLm1vZHVsZXNbbmFtZV0gPSByZWYuY3JlYXRlX21vZHVsZShuYW1lLHRoaXMsbW9kdWxlcz09PXVuZGVmaW5lZD9bXTptb2R1bGVzKTtcclxuXHRcdFx0XHRyZXR1cm4gdGhpcy5tb2R1bGVzW25hbWVdO1xyXG5cdFx0XHR9XHJcblx0XHRcdHRoaXMucmVuZGVyID0gZnVuY3Rpb24oYSxiLGMpe1xyXG5cdFx0XHRcdHZhciB0ZW1wbGF0ZSxcclxuXHRcdFx0XHRcdHRhcmdldCxcclxuXHRcdFx0XHRcdGluaXRpYWxfZGF0YSxcclxuXHRcdFx0XHRcdG1vZHVsZSxcclxuXHRcdFx0XHRcdHNldF9yb290ID0gZnVuY3Rpb24oKXtcclxuXHRcdFx0XHRcdFx0dmFyIF90YXJnZXQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImRpbGwtcm9vdFwiKTtcclxuXHRcdFx0XHRcdFx0cmV0dXJuIF90YXJnZXQgPT09IG51bGwgPyBkb2N1bWVudC5ib2R5IDogX3RhcmdldDtcclxuXHRcdFx0XHRcdH07XHJcblxyXG5cdFx0XHRcdHRhcmdldCA9IGE7XHJcblx0XHRcdFx0aW5pdGlhbF9kYXRhID0gYjtcclxuXHRcdFx0XHRtb2R1bGUgPSBjO1xyXG5cdFx0XHRcdC8vIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAzKSB7XHJcblx0XHRcdFx0Ly8gXHR0YXJnZXQgPSBhO1xyXG5cdFx0XHRcdC8vIFx0aW5pdGlhbF9kYXRhID0gYjtcclxuXHRcdFx0XHQvLyBcdG1vZHVsZSA9IGM7XHJcblx0XHRcdFx0Ly8gfVxyXG5cdFx0XHRcdC8vIGVsc2UgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDIpIHtcclxuXHRcdFx0XHQvLyBcdGlmIChhIGluc3RhbmNlb2YgSFRNTEVsZW1lbnQpIHtcclxuXHRcdFx0XHQvLyBcdFx0dGFyZ2V0ID0gYTtcclxuXHRcdFx0XHQvLyBcdFx0aWYgKGIgaW5zdGFuY2VvZiByZWYuTW9kdWxlKSB7XHJcblx0XHRcdFx0Ly8gXHRcdFx0aW5pdGlhbF9kYXRhID0ge307XHJcblx0XHRcdFx0Ly8gXHRcdFx0bW9kdWxlID0gYjtcclxuXHRcdFx0XHQvLyBcdFx0fVxyXG5cdFx0XHRcdC8vIFx0XHRlbHNlIHtcclxuXHRcdFx0XHQvLyBcdFx0XHRpbml0aWFsX2RhdGEgPSBiO1xyXG5cdFx0XHRcdC8vIFx0XHRcdG1vZHVsZSA9IHRoaXMubW9kdWxlKCk7XHJcblx0XHRcdFx0Ly8gXHRcdH1cclxuXHRcdFx0XHQvLyBcdH1cclxuXHRcdFx0XHQvLyBcdGVsc2Uge1xyXG5cdFx0XHRcdC8vIFx0XHR0YXJnZXQgPSBzZXRfcm9vdCgpO1xyXG5cdFx0XHRcdC8vIFx0XHRpbml0aWFsX2RhdGEgPSBhO1xyXG5cdFx0XHRcdC8vIFx0XHRtb2R1bGUgPSBiO1xyXG5cdFx0XHRcdC8vIFx0fVxyXG5cdFx0XHRcdC8vIH1cclxuXHRcdFx0XHQvLyBlbHNlIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAxKSB7XHJcblx0XHRcdFx0Ly8gXHRpZiAoYSBpbnN0YW5jZW9mIEhUTUxFbGVtZW50KSB7XHJcblx0XHRcdFx0Ly8gXHRcdHRhcmdldCA9IGE7XHJcblx0XHRcdFx0Ly8gXHRcdGluaXRpYWxfZGF0YSA9IHt9O1xyXG5cdFx0XHRcdC8vIFx0XHRtb2R1bGUgPSB0aGlzLm1vZHVsZSgpO1xyXG5cdFx0XHRcdC8vIFx0fVxyXG5cdFx0XHRcdC8vIFx0ZWxzZSBpZiAoYSBpbnN0YW5jZW9mIHJlZi5Nb2R1bGUpIHtcclxuXHRcdFx0XHQvLyBcdFx0dGFyZ2V0ID0gc2V0X3Jvb3QoKTtcclxuXHRcdFx0XHQvLyBcdFx0aW5pdGlhbF9kYXRhID0gYjtcclxuXHRcdFx0XHQvLyBcdFx0bW9kdWxlID0gYTtcclxuXHRcdFx0XHQvLyBcdH1cclxuXHRcdFx0XHQvLyBcdGVsc2UgaWYgKFxyXG5cdFx0XHRcdC8vIFx0XHRhLmhhc093blByb3BlcnR5KFwidGFyZ2V0XCIpXHJcblx0XHRcdFx0Ly8gXHRcdCYmIGEuaGFzT3duUHJvcGVydHkoXCJpbml0aWFsX2RhdGFcIilcclxuXHRcdFx0XHQvLyBcdFx0JiYgYS5oYXNPd25Qcm9wZXJ0eShcIm1vZHVsZVwiKVxyXG5cdFx0XHRcdC8vIFx0KSB7XHJcblx0XHRcdFx0Ly8gXHRcdHRhcmdldCA9IGEudGFyZ2V0O1xyXG5cdFx0XHRcdC8vIFx0XHRpbml0aWFsX2RhdGEgPSBhLmluaXRpYWxfZGF0YTtcclxuXHRcdFx0XHQvLyBcdFx0bW9kdWxlID0gYS5tb2R1bGU7XHJcblx0XHRcdFx0Ly8gXHR9XHJcblx0XHRcdFx0Ly8gXHRlbHNlIHtcclxuXHRcdFx0XHQvLyBcdFx0dGFyZ2V0ID0gc2V0X3Jvb3QoKTtcclxuXHRcdFx0XHQvLyBcdFx0aW5pdGlhbF9kYXRhID0gYTtcclxuXHRcdFx0XHQvLyBcdFx0bW9kdWxlID0gdGhpcy5tb2R1bGUoKTtcclxuXHRcdFx0XHQvLyBcdH1cclxuXHRcdFx0XHQvLyB9XHJcblx0XHRcdFx0dGVtcGxhdGUgPSByZWYuY3JlYXRlX3RlbXBsYXRlKHRhcmdldCxpbml0aWFsX2RhdGEsbW9kdWxlKTtcclxuXHRcdFx0XHRyZWYucmVuZGVyX2VsZW1lbnQodGFyZ2V0LHRlbXBsYXRlKTtcclxuXHRcdFx0XHRyZW5kZXJzLnB1c2goe3RhcmdldDp0YXJnZXQsdGVtcGxhdGU6dGVtcGxhdGV9KTtcclxuXHRcdFx0fVxyXG5cdFx0XHR0aGlzLmNoYW5nZSA9IGZ1bmN0aW9uKGV2ZW50KXtcclxuXHRcdFx0XHRldmVudCAmJiBldmVudCgpO1xyXG5cdFx0XHRcdHJlbmRlcnMuZm9yRWFjaChmdW5jdGlvbih4KXtcclxuXHRcdFx0XHRcdHJlZi5yZW5kZXJfZWxlbWVudCh4LnRhcmdldCx4LnRlbXBsYXRlKTtcclxuXHRcdFx0XHR9LmJpbmQodGhpcykpO1xyXG5cdFx0XHR9O1xyXG5cdFx0XHR0aGlzLmNvbXBvbmVudCA9IHdpbmRvdy5fZGlsbC5nZW5lcmF0ZV9jb21wb25lbnQ7XHJcblx0XHRcdHRoaXMuc2VydmljZSA9IHdpbmRvdy5fZGlsbC5nZW5lcmF0ZV9zZXJ2aWNlO1xyXG5cdFx0XHR0aGlzLmJ1YmJsZV9jaGFuZ2UgPSBmdW5jdGlvbihkYXRhLHRhcmdldCx2YWx1ZSl7XHJcblx0XHRcdFx0dmFyIHJlY3Vyc2VyID0gZnVuY3Rpb24oZGF0YSx0YXJnZXQsdmFsdWUpe1xyXG5cdFx0XHRcdFx0aWYgKGRhdGEuaGFzT3duUHJvcGVydHkodGFyZ2V0KSkge1xyXG5cdFx0XHRcdFx0XHRkYXRhW3RhcmdldF0gPSB2YWx1ZTtcclxuXHRcdFx0XHRcdFx0cmV0dXJuO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0aWYgKGRhdGEuaGFzT3duUHJvcGVydHkoXCJfZGlzcGxheVwiKSkge1xyXG5cdFx0XHRcdFx0XHRyZXR1cm4gcmVjdXJzZXIoZGF0YS5fZGlzcGxheSx0YXJnZXQsdmFsdWUpO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRyZWN1cnNlcihkYXRhLHRhcmdldCx2YWx1ZSk7XHJcblx0XHRcdH1cclxuXHRcdH07XHJcblxyXG5cdHdpbmRvdy5kaWxsID0gbmV3IERpbGwoKTtcclxuXHRkZWxldGUgd2luZG93Ll9kaWxsO1xyXG59KCkpO1xyXG4iXX0=
