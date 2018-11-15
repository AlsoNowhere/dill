
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


"use strict";

(function(){

	var Component = function(name,data,template){
		this.name = name;
		this.data = data;
		this.template = template;
	}

	window._dill.Component = Component;

	window._dill.generate_component = function(name,data,template_literal){
		return new Component(name,data,template_literal);
	};

}());


"use strict";

(function(){

	window._dill.create_attributes = function(ele,data){
		var output = [];
		this.for_each(ele.attributes,function(attr){
			var name = attr.nodeName,
				event_name,
				first = name.substr(0,1),
				last = name.substr(name.length-1,1),
				finish = function(){
					ele.removeAttribute(name);
				};
			if (name === "[(value)]" || name === ":name:") {
				output.push({
					name:"value",
					value:attr.nodeValue
				});
				ele.value = data[attr.nodeValue] ? data[attr.nodeValue] : "" ;
				ele.addEventListener("input",function(){
					data[attr.nodeValue] = ele.value;
					dill.change();
				}.bind(this));
				finish();
				return;
			}
			if ( (first === "[" && last === "]") || first === ":" ) {
				output.push({
					name:name.substring(1,name.length-(first !== ":")),
					value:attr.nodeValue
				});
				finish();
				return;
			}
			if ( (first === "(" && last === ")") || last === ":" ) {
				event_name = name.substring(1,name.length-(last !== ":"));
				ele.addEventListener(event_name,function(event){
					var returns;
					if (data[attr.nodeValue] === undefined) {
						dill.change();
						return;
					}
					returns = data[attr.nodeValue].apply(data,[event,ele]);
					if (returns === false) {
						return;
					}
					dill.change();
				});
				finish();
			}
		}.bind(this));
		return output;
	}
	
}());


"use strict";

(function(){

	var Template = function(name,data,module){
		this.type = name;
		this.data = data;
		this.module = module;
	}

// This function produces a template object which represents an element inside the target section on DOM for Dill.
// The template object is extended which more branches for each child of the element.
	window._dill.create_template = function(target,data,module){
		var template = new Template(target.nodeName,data,module),
			component = false,
			has_for;

// If the element is a text node or comment then that is the end of the template branch.
		if (target.nodeName === "#text" || target.nodeName === "#comment") {
			template.value = target.nodeValue;
			return template;
		}
// This set for later. It needs to be set here because inside the template_for function it is removed from the element.
// This attribute is removed so that the render function and template function do not get stuck in a loop.
		has_for = target.hasAttribute("dill-for");

// If the function exists handle the dill-template attribute.
		this.dill_template && this.dill_template(target,data);

// If the function exists handle the dill-extends attribute.
		this.dill_extends && this.dill_extends(target,data);

// If the function exists handle the dill-if attribute.
		this.template_if && this.template_if(target,template);

// If the function exists handle the dill-for attribute.
		this.template_for && this.template_for(target,template);

// If the attribute dill-for exists then don't continue, this will be picked on whenever a new element inside this repeat is added and a template with the correct context is generated.
		if (has_for) {
			return template;
		}

// If the element is to be added into the module elements (an attribute like #exmaple) then it is found and added here.
		this.for_each(target.attributes,function(attr){
			var name = attr.nodeName;
			if (name.substr(0,1) === "#") {
				module.set_element(name.substring(1,name.length),target);
			}
		});

// If this element is actually a component if will be found and handled as such from here.
		component = this.template_component && this.template_component(target,template,module);

// If this is a component then add attribute values (only those written as [example] or :example) to this component instance data.
		if (component) {
			this.component_attributes(target,template);
		}
// Otherwise save what the attributes are for rendering.
		else {
			template.attributes = this.create_attributes(target,data);
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

"use strict";

(function(){

	var extend = function(ele,value){
		Object.keys(value).forEach(function(key){
			var prop = key.substr(0,1) === "[" && key.substr(key.length-1,1) === "]"
			? ":" + key.substring(1,key.length-1)
			: key.substr(0,1) === "(" && key.substr(key.length-1,1) === ")"
				? key.substring(1,key.length-1) + ":"
				: key;
			ele.setAttribute(prop,value[key]);
		});
	}

	window._dill.dill_extends = function(target,data){
		if (target.hasAttribute("dill-extends")) {
			extend(target,data[target.attributes["dill-extends"].nodeValue]);
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
		if (length > 0) {
			data = this.create_data_object({
				template_object:template.data[target.attributes["dill-for"].nodeValue][0],
				parent_data:template.data,
				index:0
			});
			template.data = data;
		}
		target.removeAttribute("dill-for");
		template.for = {
			clone: target.cloneNode(true),
			initial: 1,
			currents: length > 0 ? [this.create_template(target,data,template.module)] : [],
			value: value
		}
	}

	window._dill.render_for = function(target,template){
		var initial = template.for.initial,
			target_end_for = target,
			i,
			l,
			data,
			_template,
			prop = template.data[template.for.value];
		if (template.for.initial < prop.length) {
			for (i=1;i<template.for.initial;i++) {
				target_end_for = target_end_for.nextElementSibling;
			}
			l=prop.length;
			for (i=template.for.initial;i<l;i++) {
				if (template.for.initial > 0) {
					target_end_for.insertAdjacentElement("afterend", template.for.clone.cloneNode(true));
				}
				else {
					target_end_for.parentNode.insertBefore(template.for.clone.cloneNode(true), target);
				}
				if (initial > 0 || i !== template.for.initial) {
					target_end_for = target_end_for.nextElementSibling;
				}
				else {
					target_end_for = target.previousElementSibling;
				}
				data = this.create_data_object({
					template_object:prop[i],
					parent_data:template.data._display,
					index:i
				});
				template.data = data;
				target_end_for.removeAttribute("dill-for");
				_template = this.create_template(target_end_for,template.data,template.module);
				template.for.currents.push(_template);
			}
		}
		else if (template.for.initial > prop.length) {
			for (i=1;i<prop.length;i++) {
				target_end_for = target_end_for.nextElementSibling;
			}
			for (i=0;i<template.for.initial-prop.length;i++) {
				target_end_for.parentNode.removeChild(
					template.for.initial === 1
						? target_end_for
						: target_end_for.nextElementSibling
				);
				template.for.currents.pop();
			}
		}
		target_end_for = initial > 0
			? target
			: target.previousElementSibling;
		template.for.initial = prop.length;
		(function(target_end_for){
			var i;
			for (i=0;i<prop.length;i++) {
				template.for.currents[i].data._item = prop[i];
				template.for.currents[i].data._index = i;
				typeof prop[i] === "object" && Object.keys(prop[i]).forEach(function(key){
					template.for.currents[i].data[key] = prop[i][key];
				});
			}
			for (i=0;i<template.for.initial;i++) {
				this.render_element(target_end_for,template.for.currents[i]);
				target_end_for = target_end_for.nextElementSibling;
			}
		}.apply(this,[target_end_for]));
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
		return 1;
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
	var Module = function(name,modules){
		this.name = name;
		this.components = {};
		this.services = {};
		this.elements = {};
		modules && Object.keys(modules).forEach(function(x){
			x.components.forEach(function(component){
				this.components[component.name] = component;
			}.bind(this));
			x.services.forEach(function(service){
				this.services[service.name] = service;
			}.bind(this));
			x.elements.forEach(function(element){
				this.elements[element.name] = element;
			}.bind(this));
		}.bind(this));
	}
	Module.prototype = {
		set_component: function(name_or_component,data,template_literal){
			if (name_or_component instanceof ref.Component) {
				this.components[name_or_component.name] = name_or_component;
			}
			else {
				this.components[name_or_component] = ref.generate_component(name_or_component,data,template_literal);
			}
		},
		set_service: function(name_or_service,input){
			var service;
			if (name_or_service instanceof ref.Service) {
				this.services[name_or_service.name] = name_or_service.data;
			}
			else {
				service = ref.generate_service(name_or_service,input);
				this.services[service.name] = service.data;
			}
		},
		set_element: function(name,element){
			// console.log("Set: ", name, element, this);
			this.elements[name] = element;
		}
	}

	window._dill.Module = Module;

	var new_module = function(){
		var Module = window._dill.Module;
		return function(name,modules){
			var output = new Module(name,modules);
			Object.seal(output);
			Object.freeze(output);
			return output;
		}
	}();

	window._dill.create_module = function(name,modules){
		return new_module(name,modules);
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
		if (template.hasOwnProperty("if")) {
			if_value = this.render_if(target,template);
			if (if_value === 0) {
				return if_value;
			}
		}
		if (template.hasOwnProperty("for")) {
			return this.render_for(target,template);
		}
		template.attributes && template.attributes.forEach(function(x){
			var value = this.debracer(x.value,template.data);
			target.setAttribute(x.name,value);
			if (x.name === "value") {
				setTimeout(function(){
					if (value !== undefined) {
						target.value = value;
					}
				},0);
			}
			if (!value) {
				target.removeAttribute(x.name);
			}
		}.bind(this));
		(function(){
			var index = 0;
			template.childs.forEach((function(x,i){
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

	window._dill.template_component = function(target,template,module){
		var current_component = module.components[target.nodeName.toLowerCase()];
		if (!current_component) {
			return false;
		}
		target.innerHTML = current_component.template;
		if (typeof current_component.data === "object") {
			template.data = this.create_data_object({
				template_object:current_component.data,
				parent_data:template.data,
				scope:target.hasAttribute("dill-scope")
					? target.attributes["dill-scope"].nodeValue
					: undefined
			});
		}
		else if (typeof current_component.data === "function") {
			template.data = new current_component.data();
		}
		if (template.data.hasOwnProperty("oninit")) {
			template.data.oninit();
		}
		return true;
	}

	window._dill.component_attributes = function(target,template){
		this.for_each(target.attributes,function(attr){
			var name = attr.nodeName,
				value,
				l,
				first = name.substr(0,1),
				last = name.substr(name.length-1,1);
			if ( !( (first === "[" && last === "]") || first === ":" ) ) {
				return;
			}
			value = attr.nodeValue;
			l = value.length;
			value = (value.substr(0,1) === "'" && value.substr(l-1,l) === "'")
				? value.substring(1,l-1) === "true"
					? true
					: value.substring(1,l-1) === "false"
						? false
						: value.substring(1,l-1)
				: template.data._display[value];
			name = name.substring(1,name.length-(first !== ":"));
			template.data[name] = value;
		});
	}

}());

"use strict";

(function(){
	window._dill.dill_template = function(target,data){
		var _template,
			value;
		if (target.hasAttribute("dill-template")) {
			_template = target.innerHTML;
			value = data[target.attributes["dill-template"].nodeValue];
			value = typeof value === "function" ? value.apply(data) : value;
			if (value !== false) {
				target.innerHTML = value;
			}
			data._template = _template;
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
				this.modules[name] = ref.create_module(name,modules===undefined?[]:modules);
				return this.modules[name];
			}
			this.render = function(target,initial_data,module){
				var template;
				if (module === undefined) {
					module = this.module();
				}
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFfaW5pdC5qcyIsImJyYWNlci5qcyIsImNvbXBvbmVudC5qcyIsImNyZWF0ZS1hdHRyaWJ1dGVzLmpzIiwiY3JlYXRlLXRlbXBsYXRlLmpzIiwiY3JlYXRlX2RhdGFfb2JqZWN0LmpzIiwiZXh0ZW5kcy5qcyIsImZvci5qcyIsImlmLmpzIiwibWlzYy5qcyIsIm1vZHVsZS5qcyIsInJlbmRlci1lbGVtZW50LmpzIiwic2VydmljZS5qcyIsInRlbXBsYXRlLWNvbXBvbmVudC5qcyIsInRlbXBsYXRlLmpzIiwiel9tYWluLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ1JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNwREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN6REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN4RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDcEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN4Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDL0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQy9DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN0REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJkaWxsLmpzIiwic291cmNlc0NvbnRlbnQiOlsiXHJcblwidXNlIHN0cmljdFwiO1xyXG5cclxuKGZ1bmN0aW9uKCl7XHJcblx0d2luZG93Ll9kaWxsID0ge1xyXG5cdFx0bW9kdWxlczoge31cclxuXHR9O1xyXG59KCkpO1xyXG4iLCJcclxuXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG4oZnVuY3Rpb24oKXtcclxuXHJcblx0dmFyIGRlYnJhY2VyID0gZnVuY3Rpb24odGV4dCxkYXRhKXtcclxuXHRcdHZhciBpbnZlcnNlID0gZmFsc2UsXHJcblx0XHRcdG91dHB1dCxcclxuXHRcdFx0dmFsdWU7XHJcblx0XHRpZiAodGV4dC5zdWJzdHIoMCwxKSA9PT0gXCIhXCIpIHtcclxuXHRcdFx0dGV4dCA9IHRleHQuc3Vic3RyaW5nKDEsdGV4dC5sZW5ndGgpO1xyXG5cdFx0XHRpbnZlcnNlID0gdHJ1ZTtcclxuXHRcdH1cclxuXHRcdHZhbHVlID0gZGF0YVt0ZXh0XTtcclxuXHRcdG91dHB1dCA9IHR5cGVvZiB2YWx1ZSA9PT0gXCJmdW5jdGlvblwiXHJcblx0XHRcdD8gdmFsdWUuYXBwbHkoZGF0YSlcclxuXHRcdFx0OiB2YWx1ZTtcclxuXHRcdGlmIChpbnZlcnNlKSB7XHJcblx0XHRcdG91dHB1dCA9ICFvdXRwdXQ7XHRcdFxyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIG91dHB1dCA9PT0gdW5kZWZpbmVkXHJcblx0XHRcdD8gXCJcIlxyXG5cdFx0XHQ6IG91dHB1dDtcclxuXHR9XHJcblxyXG5cdHdpbmRvdy5fZGlsbC5kZWJyYWNlciA9IGRlYnJhY2VyO1xyXG5cclxuLy8gRmluZHMgYW55IHZhbHVlcyBpbnNpZGUgYSBzdHJpbmcgb2YgdGV4dCAoZS5nIFwiZXhhbXBsZSB7e3ZhbHVlfX1cIikuIEFuZCB1c2VzIHRoZSBjdXJyZW50IGRhdGEgdG8gZmlsbCBpdCBvdXQuXHJcbi8vIEUuZyBkYXRhIC0+IHt2YWx1ZTpcIk9uZVwifSB0ZXh0IC0+IFwiZXhhbXBsZSB7e3ZhbHVlfX1cIiA9IFwiZXhhbXBsZSBPbmVcIi5cclxuXHR3aW5kb3cuX2RpbGwuYnJhY2VyID0gZnVuY3Rpb24odGV4dCxkYXRhKXtcclxuXHRcdHZhciByZWN1cnNlciA9IGZ1bmN0aW9uKHRleHRfc2VnbWVudCl7XHJcblx0XHRcdHZhciBsZWZ0ID0gdGV4dF9zZWdtZW50LmluZGV4T2YoXCJ7e1wiKSxcclxuXHRcdFx0XHRyaWdodCA9IHRleHRfc2VnbWVudC5pbmRleE9mKFwifX1cIik7XHJcblx0XHRcdGlmIChsZWZ0ID09PSAtMSkge1xyXG5cdFx0XHRcdHJldHVybiB0ZXh0X3NlZ21lbnQ7XHJcblx0XHRcdH1cclxuXHRcdFx0aWYgKHJpZ2h0ID09PSAtMSkge1xyXG5cdFx0XHRcdHJldHVybiB0ZXh0X3NlZ21lbnQ7XHJcblx0XHRcdH1cclxuXHRcdFx0cmV0dXJuIHRleHRfc2VnbWVudC5zdWJzdHJpbmcoMCxsZWZ0KVxyXG5cdFx0XHRcdCsgZGVicmFjZXIoXHJcblx0XHRcdFx0XHR0ZXh0X3NlZ21lbnQuc3Vic3RyaW5nKGxlZnQrMixyaWdodCksXHJcblx0XHRcdFx0XHRkYXRhXHJcblx0XHRcdFx0KVxyXG5cdFx0XHRcdCsgcmVjdXJzZXIoXHJcblx0XHRcdFx0XHR0ZXh0X3NlZ21lbnQuc3Vic3RyaW5nKHJpZ2h0KzIsdGV4dF9zZWdtZW50Lmxlbmd0aClcclxuXHRcdFx0XHQpO1xyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIHJlY3Vyc2VyKHRleHQpO1xyXG5cdH1cclxuXHRcclxufSgpKTtcclxuIiwiXHJcblwidXNlIHN0cmljdFwiO1xyXG5cclxuKGZ1bmN0aW9uKCl7XHJcblxyXG5cdHZhciBDb21wb25lbnQgPSBmdW5jdGlvbihuYW1lLGRhdGEsdGVtcGxhdGUpe1xyXG5cdFx0dGhpcy5uYW1lID0gbmFtZTtcclxuXHRcdHRoaXMuZGF0YSA9IGRhdGE7XHJcblx0XHR0aGlzLnRlbXBsYXRlID0gdGVtcGxhdGU7XHJcblx0fVxyXG5cclxuXHR3aW5kb3cuX2RpbGwuQ29tcG9uZW50ID0gQ29tcG9uZW50O1xyXG5cclxuXHR3aW5kb3cuX2RpbGwuZ2VuZXJhdGVfY29tcG9uZW50ID0gZnVuY3Rpb24obmFtZSxkYXRhLHRlbXBsYXRlX2xpdGVyYWwpe1xyXG5cdFx0cmV0dXJuIG5ldyBDb21wb25lbnQobmFtZSxkYXRhLHRlbXBsYXRlX2xpdGVyYWwpO1xyXG5cdH07XHJcblxyXG59KCkpO1xyXG4iLCJcclxuXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG4oZnVuY3Rpb24oKXtcclxuXHJcblx0d2luZG93Ll9kaWxsLmNyZWF0ZV9hdHRyaWJ1dGVzID0gZnVuY3Rpb24oZWxlLGRhdGEpe1xyXG5cdFx0dmFyIG91dHB1dCA9IFtdO1xyXG5cdFx0dGhpcy5mb3JfZWFjaChlbGUuYXR0cmlidXRlcyxmdW5jdGlvbihhdHRyKXtcclxuXHRcdFx0dmFyIG5hbWUgPSBhdHRyLm5vZGVOYW1lLFxyXG5cdFx0XHRcdGV2ZW50X25hbWUsXHJcblx0XHRcdFx0Zmlyc3QgPSBuYW1lLnN1YnN0cigwLDEpLFxyXG5cdFx0XHRcdGxhc3QgPSBuYW1lLnN1YnN0cihuYW1lLmxlbmd0aC0xLDEpLFxyXG5cdFx0XHRcdGZpbmlzaCA9IGZ1bmN0aW9uKCl7XHJcblx0XHRcdFx0XHRlbGUucmVtb3ZlQXR0cmlidXRlKG5hbWUpO1xyXG5cdFx0XHRcdH07XHJcblx0XHRcdGlmIChuYW1lID09PSBcIlsodmFsdWUpXVwiIHx8IG5hbWUgPT09IFwiOm5hbWU6XCIpIHtcclxuXHRcdFx0XHRvdXRwdXQucHVzaCh7XHJcblx0XHRcdFx0XHRuYW1lOlwidmFsdWVcIixcclxuXHRcdFx0XHRcdHZhbHVlOmF0dHIubm9kZVZhbHVlXHJcblx0XHRcdFx0fSk7XHJcblx0XHRcdFx0ZWxlLnZhbHVlID0gZGF0YVthdHRyLm5vZGVWYWx1ZV0gPyBkYXRhW2F0dHIubm9kZVZhbHVlXSA6IFwiXCIgO1xyXG5cdFx0XHRcdGVsZS5hZGRFdmVudExpc3RlbmVyKFwiaW5wdXRcIixmdW5jdGlvbigpe1xyXG5cdFx0XHRcdFx0ZGF0YVthdHRyLm5vZGVWYWx1ZV0gPSBlbGUudmFsdWU7XHJcblx0XHRcdFx0XHRkaWxsLmNoYW5nZSgpO1xyXG5cdFx0XHRcdH0uYmluZCh0aGlzKSk7XHJcblx0XHRcdFx0ZmluaXNoKCk7XHJcblx0XHRcdFx0cmV0dXJuO1xyXG5cdFx0XHR9XHJcblx0XHRcdGlmICggKGZpcnN0ID09PSBcIltcIiAmJiBsYXN0ID09PSBcIl1cIikgfHwgZmlyc3QgPT09IFwiOlwiICkge1xyXG5cdFx0XHRcdG91dHB1dC5wdXNoKHtcclxuXHRcdFx0XHRcdG5hbWU6bmFtZS5zdWJzdHJpbmcoMSxuYW1lLmxlbmd0aC0oZmlyc3QgIT09IFwiOlwiKSksXHJcblx0XHRcdFx0XHR2YWx1ZTphdHRyLm5vZGVWYWx1ZVxyXG5cdFx0XHRcdH0pO1xyXG5cdFx0XHRcdGZpbmlzaCgpO1xyXG5cdFx0XHRcdHJldHVybjtcclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAoIChmaXJzdCA9PT0gXCIoXCIgJiYgbGFzdCA9PT0gXCIpXCIpIHx8IGxhc3QgPT09IFwiOlwiICkge1xyXG5cdFx0XHRcdGV2ZW50X25hbWUgPSBuYW1lLnN1YnN0cmluZygxLG5hbWUubGVuZ3RoLShsYXN0ICE9PSBcIjpcIikpO1xyXG5cdFx0XHRcdGVsZS5hZGRFdmVudExpc3RlbmVyKGV2ZW50X25hbWUsZnVuY3Rpb24oZXZlbnQpe1xyXG5cdFx0XHRcdFx0dmFyIHJldHVybnM7XHJcblx0XHRcdFx0XHRpZiAoZGF0YVthdHRyLm5vZGVWYWx1ZV0gPT09IHVuZGVmaW5lZCkge1xyXG5cdFx0XHRcdFx0XHRkaWxsLmNoYW5nZSgpO1xyXG5cdFx0XHRcdFx0XHRyZXR1cm47XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRyZXR1cm5zID0gZGF0YVthdHRyLm5vZGVWYWx1ZV0uYXBwbHkoZGF0YSxbZXZlbnQsZWxlXSk7XHJcblx0XHRcdFx0XHRpZiAocmV0dXJucyA9PT0gZmFsc2UpIHtcclxuXHRcdFx0XHRcdFx0cmV0dXJuO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0ZGlsbC5jaGFuZ2UoKTtcclxuXHRcdFx0XHR9KTtcclxuXHRcdFx0XHRmaW5pc2goKTtcclxuXHRcdFx0fVxyXG5cdFx0fS5iaW5kKHRoaXMpKTtcclxuXHRcdHJldHVybiBvdXRwdXQ7XHJcblx0fVxyXG5cdFxyXG59KCkpO1xyXG4iLCJcclxuXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG4oZnVuY3Rpb24oKXtcclxuXHJcblx0dmFyIFRlbXBsYXRlID0gZnVuY3Rpb24obmFtZSxkYXRhLG1vZHVsZSl7XHJcblx0XHR0aGlzLnR5cGUgPSBuYW1lO1xyXG5cdFx0dGhpcy5kYXRhID0gZGF0YTtcclxuXHRcdHRoaXMubW9kdWxlID0gbW9kdWxlO1xyXG5cdH1cclxuXHJcbi8vIFRoaXMgZnVuY3Rpb24gcHJvZHVjZXMgYSB0ZW1wbGF0ZSBvYmplY3Qgd2hpY2ggcmVwcmVzZW50cyBhbiBlbGVtZW50IGluc2lkZSB0aGUgdGFyZ2V0IHNlY3Rpb24gb24gRE9NIGZvciBEaWxsLlxyXG4vLyBUaGUgdGVtcGxhdGUgb2JqZWN0IGlzIGV4dGVuZGVkIHdoaWNoIG1vcmUgYnJhbmNoZXMgZm9yIGVhY2ggY2hpbGQgb2YgdGhlIGVsZW1lbnQuXHJcblx0d2luZG93Ll9kaWxsLmNyZWF0ZV90ZW1wbGF0ZSA9IGZ1bmN0aW9uKHRhcmdldCxkYXRhLG1vZHVsZSl7XHJcblx0XHR2YXIgdGVtcGxhdGUgPSBuZXcgVGVtcGxhdGUodGFyZ2V0Lm5vZGVOYW1lLGRhdGEsbW9kdWxlKSxcclxuXHRcdFx0Y29tcG9uZW50ID0gZmFsc2UsXHJcblx0XHRcdGhhc19mb3I7XHJcblxyXG4vLyBJZiB0aGUgZWxlbWVudCBpcyBhIHRleHQgbm9kZSBvciBjb21tZW50IHRoZW4gdGhhdCBpcyB0aGUgZW5kIG9mIHRoZSB0ZW1wbGF0ZSBicmFuY2guXHJcblx0XHRpZiAodGFyZ2V0Lm5vZGVOYW1lID09PSBcIiN0ZXh0XCIgfHwgdGFyZ2V0Lm5vZGVOYW1lID09PSBcIiNjb21tZW50XCIpIHtcclxuXHRcdFx0dGVtcGxhdGUudmFsdWUgPSB0YXJnZXQubm9kZVZhbHVlO1xyXG5cdFx0XHRyZXR1cm4gdGVtcGxhdGU7XHJcblx0XHR9XHJcbi8vIFRoaXMgc2V0IGZvciBsYXRlci4gSXQgbmVlZHMgdG8gYmUgc2V0IGhlcmUgYmVjYXVzZSBpbnNpZGUgdGhlIHRlbXBsYXRlX2ZvciBmdW5jdGlvbiBpdCBpcyByZW1vdmVkIGZyb20gdGhlIGVsZW1lbnQuXHJcbi8vIFRoaXMgYXR0cmlidXRlIGlzIHJlbW92ZWQgc28gdGhhdCB0aGUgcmVuZGVyIGZ1bmN0aW9uIGFuZCB0ZW1wbGF0ZSBmdW5jdGlvbiBkbyBub3QgZ2V0IHN0dWNrIGluIGEgbG9vcC5cclxuXHRcdGhhc19mb3IgPSB0YXJnZXQuaGFzQXR0cmlidXRlKFwiZGlsbC1mb3JcIik7XHJcblxyXG4vLyBJZiB0aGUgZnVuY3Rpb24gZXhpc3RzIGhhbmRsZSB0aGUgZGlsbC10ZW1wbGF0ZSBhdHRyaWJ1dGUuXHJcblx0XHR0aGlzLmRpbGxfdGVtcGxhdGUgJiYgdGhpcy5kaWxsX3RlbXBsYXRlKHRhcmdldCxkYXRhKTtcclxuXHJcbi8vIElmIHRoZSBmdW5jdGlvbiBleGlzdHMgaGFuZGxlIHRoZSBkaWxsLWV4dGVuZHMgYXR0cmlidXRlLlxyXG5cdFx0dGhpcy5kaWxsX2V4dGVuZHMgJiYgdGhpcy5kaWxsX2V4dGVuZHModGFyZ2V0LGRhdGEpO1xyXG5cclxuLy8gSWYgdGhlIGZ1bmN0aW9uIGV4aXN0cyBoYW5kbGUgdGhlIGRpbGwtaWYgYXR0cmlidXRlLlxyXG5cdFx0dGhpcy50ZW1wbGF0ZV9pZiAmJiB0aGlzLnRlbXBsYXRlX2lmKHRhcmdldCx0ZW1wbGF0ZSk7XHJcblxyXG4vLyBJZiB0aGUgZnVuY3Rpb24gZXhpc3RzIGhhbmRsZSB0aGUgZGlsbC1mb3IgYXR0cmlidXRlLlxyXG5cdFx0dGhpcy50ZW1wbGF0ZV9mb3IgJiYgdGhpcy50ZW1wbGF0ZV9mb3IodGFyZ2V0LHRlbXBsYXRlKTtcclxuXHJcbi8vIElmIHRoZSBhdHRyaWJ1dGUgZGlsbC1mb3IgZXhpc3RzIHRoZW4gZG9uJ3QgY29udGludWUsIHRoaXMgd2lsbCBiZSBwaWNrZWQgb24gd2hlbmV2ZXIgYSBuZXcgZWxlbWVudCBpbnNpZGUgdGhpcyByZXBlYXQgaXMgYWRkZWQgYW5kIGEgdGVtcGxhdGUgd2l0aCB0aGUgY29ycmVjdCBjb250ZXh0IGlzIGdlbmVyYXRlZC5cclxuXHRcdGlmIChoYXNfZm9yKSB7XHJcblx0XHRcdHJldHVybiB0ZW1wbGF0ZTtcclxuXHRcdH1cclxuXHJcbi8vIElmIHRoZSBlbGVtZW50IGlzIHRvIGJlIGFkZGVkIGludG8gdGhlIG1vZHVsZSBlbGVtZW50cyAoYW4gYXR0cmlidXRlIGxpa2UgI2V4bWFwbGUpIHRoZW4gaXQgaXMgZm91bmQgYW5kIGFkZGVkIGhlcmUuXHJcblx0XHR0aGlzLmZvcl9lYWNoKHRhcmdldC5hdHRyaWJ1dGVzLGZ1bmN0aW9uKGF0dHIpe1xyXG5cdFx0XHR2YXIgbmFtZSA9IGF0dHIubm9kZU5hbWU7XHJcblx0XHRcdGlmIChuYW1lLnN1YnN0cigwLDEpID09PSBcIiNcIikge1xyXG5cdFx0XHRcdG1vZHVsZS5zZXRfZWxlbWVudChuYW1lLnN1YnN0cmluZygxLG5hbWUubGVuZ3RoKSx0YXJnZXQpO1xyXG5cdFx0XHR9XHJcblx0XHR9KTtcclxuXHJcbi8vIElmIHRoaXMgZWxlbWVudCBpcyBhY3R1YWxseSBhIGNvbXBvbmVudCBpZiB3aWxsIGJlIGZvdW5kIGFuZCBoYW5kbGVkIGFzIHN1Y2ggZnJvbSBoZXJlLlxyXG5cdFx0Y29tcG9uZW50ID0gdGhpcy50ZW1wbGF0ZV9jb21wb25lbnQgJiYgdGhpcy50ZW1wbGF0ZV9jb21wb25lbnQodGFyZ2V0LHRlbXBsYXRlLG1vZHVsZSk7XHJcblxyXG4vLyBJZiB0aGlzIGlzIGEgY29tcG9uZW50IHRoZW4gYWRkIGF0dHJpYnV0ZSB2YWx1ZXMgKG9ubHkgdGhvc2Ugd3JpdHRlbiBhcyBbZXhhbXBsZV0gb3IgOmV4YW1wbGUpIHRvIHRoaXMgY29tcG9uZW50IGluc3RhbmNlIGRhdGEuXHJcblx0XHRpZiAoY29tcG9uZW50KSB7XHJcblx0XHRcdHRoaXMuY29tcG9uZW50X2F0dHJpYnV0ZXModGFyZ2V0LHRlbXBsYXRlKTtcclxuXHRcdH1cclxuLy8gT3RoZXJ3aXNlIHNhdmUgd2hhdCB0aGUgYXR0cmlidXRlcyBhcmUgZm9yIHJlbmRlcmluZy5cclxuXHRcdGVsc2Uge1xyXG5cdFx0XHR0ZW1wbGF0ZS5hdHRyaWJ1dGVzID0gdGhpcy5jcmVhdGVfYXR0cmlidXRlcyh0YXJnZXQsZGF0YSk7XHJcblx0XHR9XHJcblxyXG4vLyBGb3IgZWFjaCBjaGlsZCBlbGVtZW50IGNyZWF0ZSBhIG5ldyB0ZW1wbGF0ZSBicmFuY2guXHJcblx0XHR0ZW1wbGF0ZS5jaGlsZHMgPSBBcnJheS5wcm90b3R5cGUubWFwLmFwcGx5KHRhcmdldC5jaGlsZE5vZGVzLFsoZnVuY3Rpb24oeCl7XHJcblx0XHRcdHJldHVybiB0aGlzLmNyZWF0ZV90ZW1wbGF0ZSh4LHRlbXBsYXRlLmRhdGEsbW9kdWxlKTtcclxuXHRcdH0pLmJpbmQodGhpcyldKTtcclxuXHJcblx0XHRyZXR1cm4gdGVtcGxhdGU7XHJcblx0fVxyXG59KCkpO1xyXG4iLCJcclxuXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG4oZnVuY3Rpb24oKXtcclxuXHJcbi8vIENyZWF0ZSBuZXcgZGF0YSB1c2luZyBhbiBleGlzdGluZyBkYXRhIHN0cnVjdHVyZS5cclxuXHR3aW5kb3cuX2RpbGwuY3JlYXRlX2RhdGFfb2JqZWN0ID0gZnVuY3Rpb24oaW5wdXQpe1xyXG5cdFx0dmFyIHRlbXBsYXRlX29iamVjdCA9IGlucHV0LnRlbXBsYXRlX29iamVjdCxcclxuXHRcdFx0cGFyZW50X2RhdGEgPSBpbnB1dC5wYXJlbnRfZGF0YSxcclxuXHRcdFx0aW5kZXggPSBpbnB1dC5pbmRleCxcclxuLy8gU2NvcGUgY2FuIGJlICdub3JtYWwnLCAnaXNvbGF0ZSdcclxuXHRcdFx0c2NvcGUgPSBpbnB1dC5zY29wZSxcclxuXHRcdFx0RGF0YSA9IGZ1bmN0aW9uKHRlbXBsYXRlX29iamVjdCl7XHJcblx0XHRcdFx0dHlwZW9mIHRlbXBsYXRlX29iamVjdCA9PT0gXCJvYmplY3RcIiAmJiBPYmplY3Qua2V5cyh0ZW1wbGF0ZV9vYmplY3QpLmZvckVhY2goKGZ1bmN0aW9uKGtleSl7XHJcblx0XHRcdFx0XHR0aGlzW2tleV0gPSB0ZW1wbGF0ZV9vYmplY3Rba2V5XTtcclxuXHRcdFx0XHR9KS5iaW5kKHRoaXMpKTtcclxuXHJcbi8vIElmIHRoaXMgZnVuY3Rpb24gaGFzIHRoaXMgYXJndW1lbnQgdGhlbiBpdCBoYXMgY29tZSBmcm9tIGEgZGlsbC1mb3IuXHJcblx0XHRcdFx0aWYgKGluZGV4ICE9PSB1bmRlZmluZWQpIHtcclxuXHRcdFx0XHRcdHRoaXMuX2l0ZW0gPSB0ZW1wbGF0ZV9vYmplY3Q7XHJcblx0XHRcdFx0XHR0aGlzLl9pbmRleCA9IGluZGV4O1xyXG5cdFx0XHRcdH1cclxuXHJcbi8vIElmIHNjb3BlIGlzIG5vdCBpc29sYXRlZCB0aGVuIGFkZCBhIHJlZmVyZW5jZSB0byB0aGUgcGFyZW50IGRhdGEuXHJcblx0XHRcdFx0aWYgKHNjb3BlKSB7XHJcblx0XHRcdFx0XHR0aGlzLl9kaXNwbGF5ID0gcGFyZW50X2RhdGE7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9O1xyXG5cclxuLy8gU2V0IGRlZmF1bHQgc2NvZSB0byBcIm5vcm1hbFwiIGlmIHVuZGVmaW5lZC5cclxuXHRcdHNjb3BlID0gc2NvcGUgPT09IFwibm9ybWFsXCIgfHwgc2NvcGUgPT09IHVuZGVmaW5lZCB8fCBzY29wZSAhPT0gXCJpc29sYXRlXCI7XHJcblxyXG4vLyBJZiBzY29wZSBpcyBub3QgaXNvbGF0ZWQgdGhlbiBzZXQgdGhlIHByb3RvdHlwZS4gSW5oZXJpdGluZyBmcm9tIGRhdGEgcGFyZW50IGlzIHRoZSBkZWZhdWx0IGFuZCBoYW5kbGVkIGF1dG9tYXRpY2FsbHkgaW4gSlMuXHJcblx0XHRpZiAoc2NvcGUpIHtcclxuXHRcdFx0RGF0YS5wcm90b3R5cGUgPSBwYXJlbnRfZGF0YTtcclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gbmV3IERhdGEodGVtcGxhdGVfb2JqZWN0KTtcclxuXHR9XHJcbn0oKSk7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxuKGZ1bmN0aW9uKCl7XHJcblxyXG5cdHZhciBleHRlbmQgPSBmdW5jdGlvbihlbGUsdmFsdWUpe1xyXG5cdFx0T2JqZWN0LmtleXModmFsdWUpLmZvckVhY2goZnVuY3Rpb24oa2V5KXtcclxuXHRcdFx0dmFyIHByb3AgPSBrZXkuc3Vic3RyKDAsMSkgPT09IFwiW1wiICYmIGtleS5zdWJzdHIoa2V5Lmxlbmd0aC0xLDEpID09PSBcIl1cIlxyXG5cdFx0XHQ/IFwiOlwiICsga2V5LnN1YnN0cmluZygxLGtleS5sZW5ndGgtMSlcclxuXHRcdFx0OiBrZXkuc3Vic3RyKDAsMSkgPT09IFwiKFwiICYmIGtleS5zdWJzdHIoa2V5Lmxlbmd0aC0xLDEpID09PSBcIilcIlxyXG5cdFx0XHRcdD8ga2V5LnN1YnN0cmluZygxLGtleS5sZW5ndGgtMSkgKyBcIjpcIlxyXG5cdFx0XHRcdDoga2V5O1xyXG5cdFx0XHRlbGUuc2V0QXR0cmlidXRlKHByb3AsdmFsdWVba2V5XSk7XHJcblx0XHR9KTtcclxuXHR9XHJcblxyXG5cdHdpbmRvdy5fZGlsbC5kaWxsX2V4dGVuZHMgPSBmdW5jdGlvbih0YXJnZXQsZGF0YSl7XHJcblx0XHRpZiAodGFyZ2V0Lmhhc0F0dHJpYnV0ZShcImRpbGwtZXh0ZW5kc1wiKSkge1xyXG5cdFx0XHRleHRlbmQodGFyZ2V0LGRhdGFbdGFyZ2V0LmF0dHJpYnV0ZXNbXCJkaWxsLWV4dGVuZHNcIl0ubm9kZVZhbHVlXSk7XHJcblx0XHR9XHJcblx0fVxyXG59KCkpO1xyXG4iLCJcclxuXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG4oZnVuY3Rpb24oKXtcclxuXHJcblx0d2luZG93Ll9kaWxsLnRlbXBsYXRlX2ZvciA9IGZ1bmN0aW9uKHRhcmdldCx0ZW1wbGF0ZSl7XHJcblx0XHRpZiAoIXRhcmdldC5oYXNBdHRyaWJ1dGUoXCJkaWxsLWZvclwiKSB8fCAhdGVtcGxhdGUuZGF0YVt0YXJnZXQuYXR0cmlidXRlc1tcImRpbGwtZm9yXCJdLm5vZGVWYWx1ZV0pIHtcclxuXHRcdFx0cmV0dXJuO1xyXG5cdFx0fVxyXG5cdFx0dmFyIGxlbmd0aCA9IHRlbXBsYXRlLmRhdGFbdGFyZ2V0LmF0dHJpYnV0ZXNbXCJkaWxsLWZvclwiXS5ub2RlVmFsdWVdLmxlbmd0aCxcclxuXHRcdFx0dmFsdWUgPSB0YXJnZXQuYXR0cmlidXRlc1tcImRpbGwtZm9yXCJdLm5vZGVWYWx1ZSxcclxuXHRcdFx0ZGF0YTtcclxuXHRcdGlmIChsZW5ndGggPiAwKSB7XHJcblx0XHRcdGRhdGEgPSB0aGlzLmNyZWF0ZV9kYXRhX29iamVjdCh7XHJcblx0XHRcdFx0dGVtcGxhdGVfb2JqZWN0OnRlbXBsYXRlLmRhdGFbdGFyZ2V0LmF0dHJpYnV0ZXNbXCJkaWxsLWZvclwiXS5ub2RlVmFsdWVdWzBdLFxyXG5cdFx0XHRcdHBhcmVudF9kYXRhOnRlbXBsYXRlLmRhdGEsXHJcblx0XHRcdFx0aW5kZXg6MFxyXG5cdFx0XHR9KTtcclxuXHRcdFx0dGVtcGxhdGUuZGF0YSA9IGRhdGE7XHJcblx0XHR9XHJcblx0XHR0YXJnZXQucmVtb3ZlQXR0cmlidXRlKFwiZGlsbC1mb3JcIik7XHJcblx0XHR0ZW1wbGF0ZS5mb3IgPSB7XHJcblx0XHRcdGNsb25lOiB0YXJnZXQuY2xvbmVOb2RlKHRydWUpLFxyXG5cdFx0XHRpbml0aWFsOiAxLFxyXG5cdFx0XHRjdXJyZW50czogbGVuZ3RoID4gMCA/IFt0aGlzLmNyZWF0ZV90ZW1wbGF0ZSh0YXJnZXQsZGF0YSx0ZW1wbGF0ZS5tb2R1bGUpXSA6IFtdLFxyXG5cdFx0XHR2YWx1ZTogdmFsdWVcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdHdpbmRvdy5fZGlsbC5yZW5kZXJfZm9yID0gZnVuY3Rpb24odGFyZ2V0LHRlbXBsYXRlKXtcclxuXHRcdHZhciBpbml0aWFsID0gdGVtcGxhdGUuZm9yLmluaXRpYWwsXHJcblx0XHRcdHRhcmdldF9lbmRfZm9yID0gdGFyZ2V0LFxyXG5cdFx0XHRpLFxyXG5cdFx0XHRsLFxyXG5cdFx0XHRkYXRhLFxyXG5cdFx0XHRfdGVtcGxhdGUsXHJcblx0XHRcdHByb3AgPSB0ZW1wbGF0ZS5kYXRhW3RlbXBsYXRlLmZvci52YWx1ZV07XHJcblx0XHRpZiAodGVtcGxhdGUuZm9yLmluaXRpYWwgPCBwcm9wLmxlbmd0aCkge1xyXG5cdFx0XHRmb3IgKGk9MTtpPHRlbXBsYXRlLmZvci5pbml0aWFsO2krKykge1xyXG5cdFx0XHRcdHRhcmdldF9lbmRfZm9yID0gdGFyZ2V0X2VuZF9mb3IubmV4dEVsZW1lbnRTaWJsaW5nO1xyXG5cdFx0XHR9XHJcblx0XHRcdGw9cHJvcC5sZW5ndGg7XHJcblx0XHRcdGZvciAoaT10ZW1wbGF0ZS5mb3IuaW5pdGlhbDtpPGw7aSsrKSB7XHJcblx0XHRcdFx0aWYgKHRlbXBsYXRlLmZvci5pbml0aWFsID4gMCkge1xyXG5cdFx0XHRcdFx0dGFyZ2V0X2VuZF9mb3IuaW5zZXJ0QWRqYWNlbnRFbGVtZW50KFwiYWZ0ZXJlbmRcIiwgdGVtcGxhdGUuZm9yLmNsb25lLmNsb25lTm9kZSh0cnVlKSk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGVsc2Uge1xyXG5cdFx0XHRcdFx0dGFyZ2V0X2VuZF9mb3IucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUodGVtcGxhdGUuZm9yLmNsb25lLmNsb25lTm9kZSh0cnVlKSwgdGFyZ2V0KTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYgKGluaXRpYWwgPiAwIHx8IGkgIT09IHRlbXBsYXRlLmZvci5pbml0aWFsKSB7XHJcblx0XHRcdFx0XHR0YXJnZXRfZW5kX2ZvciA9IHRhcmdldF9lbmRfZm9yLm5leHRFbGVtZW50U2libGluZztcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0ZWxzZSB7XHJcblx0XHRcdFx0XHR0YXJnZXRfZW5kX2ZvciA9IHRhcmdldC5wcmV2aW91c0VsZW1lbnRTaWJsaW5nO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRkYXRhID0gdGhpcy5jcmVhdGVfZGF0YV9vYmplY3Qoe1xyXG5cdFx0XHRcdFx0dGVtcGxhdGVfb2JqZWN0OnByb3BbaV0sXHJcblx0XHRcdFx0XHRwYXJlbnRfZGF0YTp0ZW1wbGF0ZS5kYXRhLl9kaXNwbGF5LFxyXG5cdFx0XHRcdFx0aW5kZXg6aVxyXG5cdFx0XHRcdH0pO1xyXG5cdFx0XHRcdHRlbXBsYXRlLmRhdGEgPSBkYXRhO1xyXG5cdFx0XHRcdHRhcmdldF9lbmRfZm9yLnJlbW92ZUF0dHJpYnV0ZShcImRpbGwtZm9yXCIpO1xyXG5cdFx0XHRcdF90ZW1wbGF0ZSA9IHRoaXMuY3JlYXRlX3RlbXBsYXRlKHRhcmdldF9lbmRfZm9yLHRlbXBsYXRlLmRhdGEsdGVtcGxhdGUubW9kdWxlKTtcclxuXHRcdFx0XHR0ZW1wbGF0ZS5mb3IuY3VycmVudHMucHVzaChfdGVtcGxhdGUpO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0XHRlbHNlIGlmICh0ZW1wbGF0ZS5mb3IuaW5pdGlhbCA+IHByb3AubGVuZ3RoKSB7XHJcblx0XHRcdGZvciAoaT0xO2k8cHJvcC5sZW5ndGg7aSsrKSB7XHJcblx0XHRcdFx0dGFyZ2V0X2VuZF9mb3IgPSB0YXJnZXRfZW5kX2Zvci5uZXh0RWxlbWVudFNpYmxpbmc7XHJcblx0XHRcdH1cclxuXHRcdFx0Zm9yIChpPTA7aTx0ZW1wbGF0ZS5mb3IuaW5pdGlhbC1wcm9wLmxlbmd0aDtpKyspIHtcclxuXHRcdFx0XHR0YXJnZXRfZW5kX2Zvci5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKFxyXG5cdFx0XHRcdFx0dGVtcGxhdGUuZm9yLmluaXRpYWwgPT09IDFcclxuXHRcdFx0XHRcdFx0PyB0YXJnZXRfZW5kX2ZvclxyXG5cdFx0XHRcdFx0XHQ6IHRhcmdldF9lbmRfZm9yLm5leHRFbGVtZW50U2libGluZ1xyXG5cdFx0XHRcdCk7XHJcblx0XHRcdFx0dGVtcGxhdGUuZm9yLmN1cnJlbnRzLnBvcCgpO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0XHR0YXJnZXRfZW5kX2ZvciA9IGluaXRpYWwgPiAwXHJcblx0XHRcdD8gdGFyZ2V0XHJcblx0XHRcdDogdGFyZ2V0LnByZXZpb3VzRWxlbWVudFNpYmxpbmc7XHJcblx0XHR0ZW1wbGF0ZS5mb3IuaW5pdGlhbCA9IHByb3AubGVuZ3RoO1xyXG5cdFx0KGZ1bmN0aW9uKHRhcmdldF9lbmRfZm9yKXtcclxuXHRcdFx0dmFyIGk7XHJcblx0XHRcdGZvciAoaT0wO2k8cHJvcC5sZW5ndGg7aSsrKSB7XHJcblx0XHRcdFx0dGVtcGxhdGUuZm9yLmN1cnJlbnRzW2ldLmRhdGEuX2l0ZW0gPSBwcm9wW2ldO1xyXG5cdFx0XHRcdHRlbXBsYXRlLmZvci5jdXJyZW50c1tpXS5kYXRhLl9pbmRleCA9IGk7XHJcblx0XHRcdFx0dHlwZW9mIHByb3BbaV0gPT09IFwib2JqZWN0XCIgJiYgT2JqZWN0LmtleXMocHJvcFtpXSkuZm9yRWFjaChmdW5jdGlvbihrZXkpe1xyXG5cdFx0XHRcdFx0dGVtcGxhdGUuZm9yLmN1cnJlbnRzW2ldLmRhdGFba2V5XSA9IHByb3BbaV1ba2V5XTtcclxuXHRcdFx0XHR9KTtcclxuXHRcdFx0fVxyXG5cdFx0XHRmb3IgKGk9MDtpPHRlbXBsYXRlLmZvci5pbml0aWFsO2krKykge1xyXG5cdFx0XHRcdHRoaXMucmVuZGVyX2VsZW1lbnQodGFyZ2V0X2VuZF9mb3IsdGVtcGxhdGUuZm9yLmN1cnJlbnRzW2ldKTtcclxuXHRcdFx0XHR0YXJnZXRfZW5kX2ZvciA9IHRhcmdldF9lbmRfZm9yLm5leHRFbGVtZW50U2libGluZztcclxuXHRcdFx0fVxyXG5cdFx0fS5hcHBseSh0aGlzLFt0YXJnZXRfZW5kX2Zvcl0pKTtcclxuXHRcdHJldHVybiB0ZW1wbGF0ZS5mb3IuaW5pdGlhbDtcclxuXHR9XHJcbn0oKSk7XHJcbiIsIlxyXG5cInVzZSBzdHJpY3RcIjtcclxuXHJcbihmdW5jdGlvbigpe1xyXG5cclxuXHR3aW5kb3cuX2RpbGwudGVtcGxhdGVfaWYgPSBmdW5jdGlvbih0YXJnZXQsdGVtcGxhdGUpe1xyXG5cdFx0aWYgKHRhcmdldC5oYXNBdHRyaWJ1dGUoXCJkaWxsLWlmXCIpKSB7XHJcblx0XHRcdHRlbXBsYXRlLmlmID0ge1xyXG5cdFx0XHRcdGVsZW1lbnQ6IHRhcmdldCxcclxuXHRcdFx0XHR2YWx1ZTogdGFyZ2V0LmF0dHJpYnV0ZXNbXCJkaWxsLWlmXCJdLm5vZGVWYWx1ZSxcclxuXHRcdFx0XHRpbml0aWFsOiB0cnVlLFxyXG5cdFx0XHRcdHBhcmVudDogdGFyZ2V0LnBhcmVudE5vZGVcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0d2luZG93Ll9kaWxsLnJlbmRlcl9pZiA9IGZ1bmN0aW9uKHRhcmdldCx0ZW1wbGF0ZSl7XHJcblx0XHR2YXIgaWZfdmFsdWUgPSB0aGlzLmRlYnJhY2VyKHRlbXBsYXRlLmlmLnZhbHVlLHRlbXBsYXRlLmRhdGEpO1xyXG5cdFx0aWYgKCF0ZW1wbGF0ZS5pZi5pbml0aWFsICYmIGlmX3ZhbHVlKSB7XHJcblx0XHRcdGlmICh0YXJnZXQgPT09IHVuZGVmaW5lZCkge1xyXG5cdFx0XHRcdHRlbXBsYXRlLmlmLnBhcmVudC5hcHBlbmRDaGlsZCh0ZW1wbGF0ZS5pZi5lbGVtZW50KTtcclxuXHRcdFx0fVxyXG5cdFx0XHRlbHNlIHtcclxuXHRcdFx0XHR0YXJnZXQucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUodGVtcGxhdGUuaWYuZWxlbWVudCx0YXJnZXQpO1xyXG5cdFx0XHR9XHJcblx0XHRcdHRhcmdldCA9IHRlbXBsYXRlLmlmLmVsZW1lbnQ7XHJcblx0XHRcdHRlbXBsYXRlLmlmLmluaXRpYWwgPSBpZl92YWx1ZTtcclxuXHRcdH1cclxuXHRcdGVsc2UgaWYgKHRlbXBsYXRlLmlmLmluaXRpYWwgJiYgIWlmX3ZhbHVlKSB7XHJcblx0XHRcdHRhcmdldC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHRhcmdldCk7XHJcblx0XHRcdHRlbXBsYXRlLmlmLmluaXRpYWwgPSBpZl92YWx1ZTtcclxuXHRcdFx0cmV0dXJuIDA7XHJcblx0XHR9XHJcblx0XHRlbHNlIGlmICghdGVtcGxhdGUuaWYuaW5pdGlhbCAmJiAhaWZfdmFsdWUpIHtcclxuXHRcdFx0cmV0dXJuIDA7XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gMTtcclxuXHR9XHJcblx0XHJcbn0oKSk7XHJcbiIsIlxyXG5cInVzZSBzdHJpY3RcIjtcclxuXHJcbihmdW5jdGlvbigpe1xyXG5cdHdpbmRvdy5fZGlsbC5mb3JfZWFjaCA9IGZ1bmN0aW9uKGxpc3QsY2FsbGJhY2spe1xyXG5cdFx0Zm9yICh2YXIgaT1saXN0Lmxlbmd0aC0xO2k+PTA7aS0tKSB7XHJcblx0XHRcdGNhbGxiYWNrKGxpc3RbaV0saSk7XHJcblx0XHR9XHJcblx0fVxyXG59KCkpO1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbihmdW5jdGlvbigpe1xyXG5cclxuXHR2YXIgcmVmID0gd2luZG93Ll9kaWxsO1xyXG5cdHZhciBNb2R1bGUgPSBmdW5jdGlvbihuYW1lLG1vZHVsZXMpe1xyXG5cdFx0dGhpcy5uYW1lID0gbmFtZTtcclxuXHRcdHRoaXMuY29tcG9uZW50cyA9IHt9O1xyXG5cdFx0dGhpcy5zZXJ2aWNlcyA9IHt9O1xyXG5cdFx0dGhpcy5lbGVtZW50cyA9IHt9O1xyXG5cdFx0bW9kdWxlcyAmJiBPYmplY3Qua2V5cyhtb2R1bGVzKS5mb3JFYWNoKGZ1bmN0aW9uKHgpe1xyXG5cdFx0XHR4LmNvbXBvbmVudHMuZm9yRWFjaChmdW5jdGlvbihjb21wb25lbnQpe1xyXG5cdFx0XHRcdHRoaXMuY29tcG9uZW50c1tjb21wb25lbnQubmFtZV0gPSBjb21wb25lbnQ7XHJcblx0XHRcdH0uYmluZCh0aGlzKSk7XHJcblx0XHRcdHguc2VydmljZXMuZm9yRWFjaChmdW5jdGlvbihzZXJ2aWNlKXtcclxuXHRcdFx0XHR0aGlzLnNlcnZpY2VzW3NlcnZpY2UubmFtZV0gPSBzZXJ2aWNlO1xyXG5cdFx0XHR9LmJpbmQodGhpcykpO1xyXG5cdFx0XHR4LmVsZW1lbnRzLmZvckVhY2goZnVuY3Rpb24oZWxlbWVudCl7XHJcblx0XHRcdFx0dGhpcy5lbGVtZW50c1tlbGVtZW50Lm5hbWVdID0gZWxlbWVudDtcclxuXHRcdFx0fS5iaW5kKHRoaXMpKTtcclxuXHRcdH0uYmluZCh0aGlzKSk7XHJcblx0fVxyXG5cdE1vZHVsZS5wcm90b3R5cGUgPSB7XHJcblx0XHRzZXRfY29tcG9uZW50OiBmdW5jdGlvbihuYW1lX29yX2NvbXBvbmVudCxkYXRhLHRlbXBsYXRlX2xpdGVyYWwpe1xyXG5cdFx0XHRpZiAobmFtZV9vcl9jb21wb25lbnQgaW5zdGFuY2VvZiByZWYuQ29tcG9uZW50KSB7XHJcblx0XHRcdFx0dGhpcy5jb21wb25lbnRzW25hbWVfb3JfY29tcG9uZW50Lm5hbWVdID0gbmFtZV9vcl9jb21wb25lbnQ7XHJcblx0XHRcdH1cclxuXHRcdFx0ZWxzZSB7XHJcblx0XHRcdFx0dGhpcy5jb21wb25lbnRzW25hbWVfb3JfY29tcG9uZW50XSA9IHJlZi5nZW5lcmF0ZV9jb21wb25lbnQobmFtZV9vcl9jb21wb25lbnQsZGF0YSx0ZW1wbGF0ZV9saXRlcmFsKTtcclxuXHRcdFx0fVxyXG5cdFx0fSxcclxuXHRcdHNldF9zZXJ2aWNlOiBmdW5jdGlvbihuYW1lX29yX3NlcnZpY2UsaW5wdXQpe1xyXG5cdFx0XHR2YXIgc2VydmljZTtcclxuXHRcdFx0aWYgKG5hbWVfb3Jfc2VydmljZSBpbnN0YW5jZW9mIHJlZi5TZXJ2aWNlKSB7XHJcblx0XHRcdFx0dGhpcy5zZXJ2aWNlc1tuYW1lX29yX3NlcnZpY2UubmFtZV0gPSBuYW1lX29yX3NlcnZpY2UuZGF0YTtcclxuXHRcdFx0fVxyXG5cdFx0XHRlbHNlIHtcclxuXHRcdFx0XHRzZXJ2aWNlID0gcmVmLmdlbmVyYXRlX3NlcnZpY2UobmFtZV9vcl9zZXJ2aWNlLGlucHV0KTtcclxuXHRcdFx0XHR0aGlzLnNlcnZpY2VzW3NlcnZpY2UubmFtZV0gPSBzZXJ2aWNlLmRhdGE7XHJcblx0XHRcdH1cclxuXHRcdH0sXHJcblx0XHRzZXRfZWxlbWVudDogZnVuY3Rpb24obmFtZSxlbGVtZW50KXtcclxuXHRcdFx0Ly8gY29uc29sZS5sb2coXCJTZXQ6IFwiLCBuYW1lLCBlbGVtZW50LCB0aGlzKTtcclxuXHRcdFx0dGhpcy5lbGVtZW50c1tuYW1lXSA9IGVsZW1lbnQ7XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHR3aW5kb3cuX2RpbGwuTW9kdWxlID0gTW9kdWxlO1xyXG5cclxuXHR2YXIgbmV3X21vZHVsZSA9IGZ1bmN0aW9uKCl7XHJcblx0XHR2YXIgTW9kdWxlID0gd2luZG93Ll9kaWxsLk1vZHVsZTtcclxuXHRcdHJldHVybiBmdW5jdGlvbihuYW1lLG1vZHVsZXMpe1xyXG5cdFx0XHR2YXIgb3V0cHV0ID0gbmV3IE1vZHVsZShuYW1lLG1vZHVsZXMpO1xyXG5cdFx0XHRPYmplY3Quc2VhbChvdXRwdXQpO1xyXG5cdFx0XHRPYmplY3QuZnJlZXplKG91dHB1dCk7XHJcblx0XHRcdHJldHVybiBvdXRwdXQ7XHJcblx0XHR9XHJcblx0fSgpO1xyXG5cclxuXHR3aW5kb3cuX2RpbGwuY3JlYXRlX21vZHVsZSA9IGZ1bmN0aW9uKG5hbWUsbW9kdWxlcyl7XHJcblx0XHRyZXR1cm4gbmV3X21vZHVsZShuYW1lLG1vZHVsZXMpO1xyXG5cdH1cclxufSgpKTtcclxuIiwiXHJcblwidXNlIHN0cmljdFwiO1xyXG5cclxuKGZ1bmN0aW9uKCl7XHJcblxyXG5cdHdpbmRvdy5fZGlsbC5yZW5kZXJfZWxlbWVudCA9IGZ1bmN0aW9uKHRhcmdldCx0ZW1wbGF0ZSl7XHJcblx0XHR2YXIgaWZfdmFsdWU7XHJcblx0XHRpZiAodGVtcGxhdGUudHlwZSA9PT0gXCIjdGV4dFwiKSB7XHJcblx0XHRcdHRhcmdldC5ub2RlVmFsdWUgPSB0aGlzLmJyYWNlcih0ZW1wbGF0ZS52YWx1ZSx0ZW1wbGF0ZS5kYXRhKTtcclxuXHRcdFx0cmV0dXJuIDE7XHJcblx0XHR9XHJcblx0XHRpZiAodGVtcGxhdGUudHlwZSA9PT0gXCIjY29tbWVudFwiKSB7XHJcblx0XHRcdHJldHVybiAxO1xyXG5cdFx0fVxyXG5cdFx0aWYgKHRlbXBsYXRlLmhhc093blByb3BlcnR5KFwiaWZcIikpIHtcclxuXHRcdFx0aWZfdmFsdWUgPSB0aGlzLnJlbmRlcl9pZih0YXJnZXQsdGVtcGxhdGUpO1xyXG5cdFx0XHRpZiAoaWZfdmFsdWUgPT09IDApIHtcclxuXHRcdFx0XHRyZXR1cm4gaWZfdmFsdWU7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHRcdGlmICh0ZW1wbGF0ZS5oYXNPd25Qcm9wZXJ0eShcImZvclwiKSkge1xyXG5cdFx0XHRyZXR1cm4gdGhpcy5yZW5kZXJfZm9yKHRhcmdldCx0ZW1wbGF0ZSk7XHJcblx0XHR9XHJcblx0XHR0ZW1wbGF0ZS5hdHRyaWJ1dGVzICYmIHRlbXBsYXRlLmF0dHJpYnV0ZXMuZm9yRWFjaChmdW5jdGlvbih4KXtcclxuXHRcdFx0dmFyIHZhbHVlID0gdGhpcy5kZWJyYWNlcih4LnZhbHVlLHRlbXBsYXRlLmRhdGEpO1xyXG5cdFx0XHR0YXJnZXQuc2V0QXR0cmlidXRlKHgubmFtZSx2YWx1ZSk7XHJcblx0XHRcdGlmICh4Lm5hbWUgPT09IFwidmFsdWVcIikge1xyXG5cdFx0XHRcdHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcclxuXHRcdFx0XHRcdGlmICh2YWx1ZSAhPT0gdW5kZWZpbmVkKSB7XHJcblx0XHRcdFx0XHRcdHRhcmdldC52YWx1ZSA9IHZhbHVlO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH0sMCk7XHJcblx0XHRcdH1cclxuXHRcdFx0aWYgKCF2YWx1ZSkge1xyXG5cdFx0XHRcdHRhcmdldC5yZW1vdmVBdHRyaWJ1dGUoeC5uYW1lKTtcclxuXHRcdFx0fVxyXG5cdFx0fS5iaW5kKHRoaXMpKTtcclxuXHRcdChmdW5jdGlvbigpe1xyXG5cdFx0XHR2YXIgaW5kZXggPSAwO1xyXG5cdFx0XHR0ZW1wbGF0ZS5jaGlsZHMuZm9yRWFjaCgoZnVuY3Rpb24oeCxpKXtcclxuXHRcdFx0XHRpbmRleCArPSB0aGlzLnJlbmRlcl9lbGVtZW50KHRhcmdldC5jaGlsZE5vZGVzW2luZGV4XSx4KTtcclxuXHRcdFx0fSkuYmluZCh0aGlzKSk7XHJcblx0XHR9LmFwcGx5KHRoaXMpKTtcclxuXHRcdHJldHVybiAxO1xyXG5cdH1cclxuXHRcclxufSgpKTtcclxuIiwiXHJcblwidXNlIHN0cmljdFwiO1xyXG5cclxuKGZ1bmN0aW9uKCl7XHJcblxyXG5cdHZhciBTZXJ2aWNlID0gZnVuY3Rpb24obmFtZSxpbnB1dCl7XHJcblx0XHR0aGlzLm5hbWUgPSBuYW1lO1xyXG5cdFx0dGhpcy5kYXRhID0gdHlwZW9mIGlucHV0ID09PSBcImZ1bmN0aW9uXCJcclxuXHRcdFx0PyAobmV3IGlucHV0KCkpXHJcblx0XHRcdDogdHlwZW9mIGlucHV0ID09PSBcIm9iamVjdFwiICYmICFBcnJheS5pc0FycmF5KGlucHV0KVxyXG5cdFx0XHRcdD8gaW5wdXRcclxuXHRcdFx0XHQ6IG51bGxcclxuXHR9XHJcblxyXG5cdHdpbmRvdy5fZGlsbC5TZXJ2aWNlID0gU2VydmljZTtcclxuXHJcblx0d2luZG93Ll9kaWxsLmdlbmVyYXRlX3NlcnZpY2UgPSBmdW5jdGlvbihuYW1lLGlucHV0KXtcclxuXHRcdHJldHVybiBuZXcgU2VydmljZShuYW1lLGlucHV0KTtcclxuXHR9O1xyXG59KCkpO1xyXG4iLCJcclxuXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG4oZnVuY3Rpb24oKXtcclxuXHJcblx0d2luZG93Ll9kaWxsLnRlbXBsYXRlX2NvbXBvbmVudCA9IGZ1bmN0aW9uKHRhcmdldCx0ZW1wbGF0ZSxtb2R1bGUpe1xyXG5cdFx0dmFyIGN1cnJlbnRfY29tcG9uZW50ID0gbW9kdWxlLmNvbXBvbmVudHNbdGFyZ2V0Lm5vZGVOYW1lLnRvTG93ZXJDYXNlKCldO1xyXG5cdFx0aWYgKCFjdXJyZW50X2NvbXBvbmVudCkge1xyXG5cdFx0XHRyZXR1cm4gZmFsc2U7XHJcblx0XHR9XHJcblx0XHR0YXJnZXQuaW5uZXJIVE1MID0gY3VycmVudF9jb21wb25lbnQudGVtcGxhdGU7XHJcblx0XHRpZiAodHlwZW9mIGN1cnJlbnRfY29tcG9uZW50LmRhdGEgPT09IFwib2JqZWN0XCIpIHtcclxuXHRcdFx0dGVtcGxhdGUuZGF0YSA9IHRoaXMuY3JlYXRlX2RhdGFfb2JqZWN0KHtcclxuXHRcdFx0XHR0ZW1wbGF0ZV9vYmplY3Q6Y3VycmVudF9jb21wb25lbnQuZGF0YSxcclxuXHRcdFx0XHRwYXJlbnRfZGF0YTp0ZW1wbGF0ZS5kYXRhLFxyXG5cdFx0XHRcdHNjb3BlOnRhcmdldC5oYXNBdHRyaWJ1dGUoXCJkaWxsLXNjb3BlXCIpXHJcblx0XHRcdFx0XHQ/IHRhcmdldC5hdHRyaWJ1dGVzW1wiZGlsbC1zY29wZVwiXS5ub2RlVmFsdWVcclxuXHRcdFx0XHRcdDogdW5kZWZpbmVkXHJcblx0XHRcdH0pO1xyXG5cdFx0fVxyXG5cdFx0ZWxzZSBpZiAodHlwZW9mIGN1cnJlbnRfY29tcG9uZW50LmRhdGEgPT09IFwiZnVuY3Rpb25cIikge1xyXG5cdFx0XHR0ZW1wbGF0ZS5kYXRhID0gbmV3IGN1cnJlbnRfY29tcG9uZW50LmRhdGEoKTtcclxuXHRcdH1cclxuXHRcdGlmICh0ZW1wbGF0ZS5kYXRhLmhhc093blByb3BlcnR5KFwib25pbml0XCIpKSB7XHJcblx0XHRcdHRlbXBsYXRlLmRhdGEub25pbml0KCk7XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gdHJ1ZTtcclxuXHR9XHJcblxyXG5cdHdpbmRvdy5fZGlsbC5jb21wb25lbnRfYXR0cmlidXRlcyA9IGZ1bmN0aW9uKHRhcmdldCx0ZW1wbGF0ZSl7XHJcblx0XHR0aGlzLmZvcl9lYWNoKHRhcmdldC5hdHRyaWJ1dGVzLGZ1bmN0aW9uKGF0dHIpe1xyXG5cdFx0XHR2YXIgbmFtZSA9IGF0dHIubm9kZU5hbWUsXHJcblx0XHRcdFx0dmFsdWUsXHJcblx0XHRcdFx0bCxcclxuXHRcdFx0XHRmaXJzdCA9IG5hbWUuc3Vic3RyKDAsMSksXHJcblx0XHRcdFx0bGFzdCA9IG5hbWUuc3Vic3RyKG5hbWUubGVuZ3RoLTEsMSk7XHJcblx0XHRcdGlmICggISggKGZpcnN0ID09PSBcIltcIiAmJiBsYXN0ID09PSBcIl1cIikgfHwgZmlyc3QgPT09IFwiOlwiICkgKSB7XHJcblx0XHRcdFx0cmV0dXJuO1xyXG5cdFx0XHR9XHJcblx0XHRcdHZhbHVlID0gYXR0ci5ub2RlVmFsdWU7XHJcblx0XHRcdGwgPSB2YWx1ZS5sZW5ndGg7XHJcblx0XHRcdHZhbHVlID0gKHZhbHVlLnN1YnN0cigwLDEpID09PSBcIidcIiAmJiB2YWx1ZS5zdWJzdHIobC0xLGwpID09PSBcIidcIilcclxuXHRcdFx0XHQ/IHZhbHVlLnN1YnN0cmluZygxLGwtMSkgPT09IFwidHJ1ZVwiXHJcblx0XHRcdFx0XHQ/IHRydWVcclxuXHRcdFx0XHRcdDogdmFsdWUuc3Vic3RyaW5nKDEsbC0xKSA9PT0gXCJmYWxzZVwiXHJcblx0XHRcdFx0XHRcdD8gZmFsc2VcclxuXHRcdFx0XHRcdFx0OiB2YWx1ZS5zdWJzdHJpbmcoMSxsLTEpXHJcblx0XHRcdFx0OiB0ZW1wbGF0ZS5kYXRhLl9kaXNwbGF5W3ZhbHVlXTtcclxuXHRcdFx0bmFtZSA9IG5hbWUuc3Vic3RyaW5nKDEsbmFtZS5sZW5ndGgtKGZpcnN0ICE9PSBcIjpcIikpO1xyXG5cdFx0XHR0ZW1wbGF0ZS5kYXRhW25hbWVdID0gdmFsdWU7XHJcblx0XHR9KTtcclxuXHR9XHJcblxyXG59KCkpO1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbihmdW5jdGlvbigpe1xyXG5cdHdpbmRvdy5fZGlsbC5kaWxsX3RlbXBsYXRlID0gZnVuY3Rpb24odGFyZ2V0LGRhdGEpe1xyXG5cdFx0dmFyIF90ZW1wbGF0ZSxcclxuXHRcdFx0dmFsdWU7XHJcblx0XHRpZiAodGFyZ2V0Lmhhc0F0dHJpYnV0ZShcImRpbGwtdGVtcGxhdGVcIikpIHtcclxuXHRcdFx0X3RlbXBsYXRlID0gdGFyZ2V0LmlubmVySFRNTDtcclxuXHRcdFx0dmFsdWUgPSBkYXRhW3RhcmdldC5hdHRyaWJ1dGVzW1wiZGlsbC10ZW1wbGF0ZVwiXS5ub2RlVmFsdWVdO1xyXG5cdFx0XHR2YWx1ZSA9IHR5cGVvZiB2YWx1ZSA9PT0gXCJmdW5jdGlvblwiID8gdmFsdWUuYXBwbHkoZGF0YSkgOiB2YWx1ZTtcclxuXHRcdFx0aWYgKHZhbHVlICE9PSBmYWxzZSkge1xyXG5cdFx0XHRcdHRhcmdldC5pbm5lckhUTUwgPSB2YWx1ZTtcclxuXHRcdFx0fVxyXG5cdFx0XHRkYXRhLl90ZW1wbGF0ZSA9IF90ZW1wbGF0ZTtcclxuXHRcdH1cclxuXHR9XHJcbn0oKSk7XHJcbiIsIlxyXG5cInVzZSBzdHJpY3RcIjtcclxuXHJcbihmdW5jdGlvbigpe1xyXG5cclxuXHR2YXIgcmVuZGVycyA9IFtdLFxyXG5cdFx0cmVmID0gd2luZG93Ll9kaWxsLFxyXG5cdFx0RGlsbCA9IGZ1bmN0aW9uKCl7XHJcblx0XHRcdHRoaXMubW9kdWxlcyA9IHt9O1xyXG5cdFx0XHR0aGlzLm1vZHVsZSA9IGZ1bmN0aW9uKG5hbWUsbW9kdWxlcyl7XHJcblx0XHRcdFx0dGhpcy5tb2R1bGVzW25hbWVdID0gcmVmLmNyZWF0ZV9tb2R1bGUobmFtZSxtb2R1bGVzPT09dW5kZWZpbmVkP1tdOm1vZHVsZXMpO1xyXG5cdFx0XHRcdHJldHVybiB0aGlzLm1vZHVsZXNbbmFtZV07XHJcblx0XHRcdH1cclxuXHRcdFx0dGhpcy5yZW5kZXIgPSBmdW5jdGlvbih0YXJnZXQsaW5pdGlhbF9kYXRhLG1vZHVsZSl7XHJcblx0XHRcdFx0dmFyIHRlbXBsYXRlO1xyXG5cdFx0XHRcdGlmIChtb2R1bGUgPT09IHVuZGVmaW5lZCkge1xyXG5cdFx0XHRcdFx0bW9kdWxlID0gdGhpcy5tb2R1bGUoKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0dGVtcGxhdGUgPSByZWYuY3JlYXRlX3RlbXBsYXRlKHRhcmdldCxpbml0aWFsX2RhdGEsbW9kdWxlKTtcclxuXHRcdFx0XHRyZWYucmVuZGVyX2VsZW1lbnQodGFyZ2V0LHRlbXBsYXRlKTtcclxuXHRcdFx0XHRyZW5kZXJzLnB1c2goe3RhcmdldDp0YXJnZXQsdGVtcGxhdGU6dGVtcGxhdGV9KTtcclxuXHRcdFx0fVxyXG5cdFx0XHR0aGlzLmNoYW5nZSA9IGZ1bmN0aW9uKGV2ZW50KXtcclxuXHRcdFx0XHRldmVudCAmJiBldmVudCgpO1xyXG5cdFx0XHRcdHJlbmRlcnMuZm9yRWFjaChmdW5jdGlvbih4KXtcclxuXHRcdFx0XHRcdHJlZi5yZW5kZXJfZWxlbWVudCh4LnRhcmdldCx4LnRlbXBsYXRlKTtcclxuXHRcdFx0XHR9LmJpbmQodGhpcykpO1xyXG5cdFx0XHR9O1xyXG5cdFx0XHR0aGlzLmNvbXBvbmVudCA9IHdpbmRvdy5fZGlsbC5nZW5lcmF0ZV9jb21wb25lbnQ7XHJcblx0XHRcdHRoaXMuc2VydmljZSA9IHdpbmRvdy5fZGlsbC5nZW5lcmF0ZV9zZXJ2aWNlO1xyXG5cdFx0XHR0aGlzLmJ1YmJsZV9jaGFuZ2UgPSBmdW5jdGlvbihkYXRhLHRhcmdldCx2YWx1ZSl7XHJcblx0XHRcdFx0dmFyIHJlY3Vyc2VyID0gZnVuY3Rpb24oZGF0YSx0YXJnZXQsdmFsdWUpe1xyXG5cdFx0XHRcdFx0aWYgKGRhdGEuaGFzT3duUHJvcGVydHkodGFyZ2V0KSkge1xyXG5cdFx0XHRcdFx0XHRkYXRhW3RhcmdldF0gPSB2YWx1ZTtcclxuXHRcdFx0XHRcdFx0cmV0dXJuO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0aWYgKGRhdGEuaGFzT3duUHJvcGVydHkoXCJfZGlzcGxheVwiKSkge1xyXG5cdFx0XHRcdFx0XHRyZXR1cm4gcmVjdXJzZXIoZGF0YS5fZGlzcGxheSx0YXJnZXQsdmFsdWUpO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRyZWN1cnNlcihkYXRhLHRhcmdldCx2YWx1ZSk7XHJcblx0XHRcdH1cclxuXHRcdH07XHJcblxyXG5cdHdpbmRvdy5kaWxsID0gbmV3IERpbGwoKTtcclxuXHRkZWxldGUgd2luZG93Ll9kaWxsO1xyXG59KCkpO1xyXG4iXX0=
