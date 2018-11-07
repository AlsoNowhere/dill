
"use strict";

(function(){
	window._dill = {};
}());


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


"use strict";

(function(){

	var Component = function(name,data,template){
		this.name = name;
		this.data = data;
		this.template = template;
	}

	window._dill.generate_component = function(name,data,template_literal){
		this.components[name] = new Component(name,data,template_literal);
	};

}());



"use strict";

(function(){
	window._dill.compose_components = function(element,data,type){
		if (element.nodeName === "#text" || element.nodeName === "#comment") {
			return element;
		}
		if (element.hasAttribute("dill-for") && !type) {
			data = data[element.attributes["dill-for"].nodeValue]
				? this.create_data_object(data[element.attributes["dill-for"].nodeValue][0], data, 0)
				: data;
		}
		if (dill.components[element.nodeName.toLowerCase()]) {
			element.innerHTML = dill.components[element.nodeName.toLowerCase()].template;
			data = this.create_data_object(dill.components[element.nodeName.toLowerCase()].data, data);
		}
		this.create_events(element,data);
		this.for_each(element.childNodes,function(x){
			this.compose_components(x,data);
		}.bind(this));
		return element;
	}
}());








"use strict";

(function(){

	window._dill.create_attributes = function(ele,data){
		var output = [];
		this.for_each(ele.attributes,function(attr){
			var name = attr.nodeName;
			if (name.substr(0,1) === "[" && name.substr(name.length-1,1) === "]") {
				output.push({
					name:name.substring(1,name.length-1),
					value:attr.nodeValue
				});
			}
		}.bind(this));
		this.create_events(ele,data);
		return output;
	}

	window._dill.create_events = function(ele,data) {
		this.for_each(ele.attributes,function(attr){
			var name = attr.nodeName,
				event_name;
			if (name.substr(0,1) === "(" && name.substr(name.length-1,1) === ")") {
				event_name = name.substring(1,name.length-1);
				ele.addEventListener(event_name,function(event){
					var returns;
					if (data[attr.nodeValue] === undefined) {
						dill.change();
					}
					else {
						returns = data[attr.nodeValue].apply(data,[event]);
						if (returns !== false) {
							dill.change();
						}
					}
				});
			}
		}.bind(this));
	}
	
}());


"use strict";

(function(){

	window._dill.create_template = function(ele,data){
		var template = {
			type: ele.nodeName,
			value: ele.nodeValue
		}
		if (ele.nodeName === "#text" || ele.nodeName === "#comment") {
			return template;
		}
		if (ele.hasAttribute("dill-if")) {
			template.if = this.generate_template(ele,"if");
		}
		if (ele.hasAttribute("dill-for")) {
			template.for = this.generate_template(ele,"for");
			if (data[template.for.value]) {
				data = this.create_data_object(data[template.for.value][0],data,0);
			}
		}
		if (dill.components[ele.nodeName.toLowerCase()]) {
			ele.innerHTML = dill.components[ele.nodeName.toLowerCase()].template;
			data = this.create_data_object(dill.components[ele.nodeName.toLowerCase()].data,data);
		}
		template.attributes = this.create_attributes(ele,data);
		if (ele.hasAttribute("dill-for")) {
			template.for.currents = [
				function(){
					var clone = ele.cloneNode(true);
					clone.removeAttribute("dill-for");
					return this.create_template(clone,data);
				}.apply(this)
			];
		}
		template.childs = Array.prototype.map.apply(ele.childNodes,[(function(x){
			return this.create_template(x,data);
		}).bind(this)]);
		return template;
	}
	
}());


"use strict";

(function(){
	window._dill.create_data_object = function(template_object,parent_data,index){
		var Data = function(template){
			Object.keys(template).forEach((function(key){
				this[key] = template[key];
			}).bind(this));
			if (index !== undefined) {
				this._item = template;
				this._index = index;
			}
			this._display = parent_data;
		}
		Data.prototype = parent_data;
		return new Data(template_object);
	}
}());


"use strict";

(function(){

	window._dill.render_for = function(target,data,template,parent){
		var target_end_for = target;
		if (!data[template.for.value]) {
			target.parentNode.removeChild(target);
			template.for.currents = [];
			return 0;
		}
		if (template.for.initial < data[template.for.value].length) {
			for (var i=1;i<template.for.initial;i++) {
				target_end_for = target_end_for.nextElementSibling;
			}
			var _j=0;
			var l=data[template.for.value].length;
			for (i=template.for.initial;i<l;i++) {
				var composed = this.compose_components(
					template.for.clone.cloneNode(true),
					this.create_data_object(data[template.for.value][l-1-_j], data, l-1-_j),
					true
				);
				_j++;
				if (template.for.initial > 0) {
					target_end_for.insertAdjacentElement("afterend", composed);
				}
				else {
					parent.insertBefore(composed, target);
				}
				var j = template.for.initial > 0
					? target_end_for.nextElementSibling
					: target_end_for.previousElementSibling;
				template.for.currents.push(
					function(){
						var clone = template.for.clone.cloneNode(true);
						clone.removeAttribute("dill-for");
						return this.create_template(clone,data);
					}.apply(this)
				);
			}
		}
		else if (template.for.initial > data[template.for.value].length) {
			for (var i=1;i<data[template.for.value].length;i++) {
				target_end_for = target_end_for.nextElementSibling;
			}
			for (i=0;i<template.for.initial-data[template.for.value].length;i++) {
				target_end_for.parentNode.removeChild(
					template.for.initial === 1
						? target_end_for
						: target_end_for.nextElementSibling
					);
				template.for.currents.pop();
			}
		}
		target_end_for = template.for.initial > 0
			? target
			: target.previousElementSibling;
		template.for.initial = data[template.for.value].length;
		for (var i=0;i<template.for.initial;i++) {
			this.render_element(
				{
					ele: target_end_for,
					data: this.create_data_object(data[template.for.value][i],data,i),
					template: template.for.currents[i]
				}
			);
			target_end_for = target_end_for.nextElementSibling;
		}
		return template.for.initial;
	}
	
}());


"use strict";

(function(){

	window._dill.render_if = function(target,data,template){
		var value = typeof data[template.if.value] === "function"
			? data[template.if.value]()
			: data[template.if.value];
		if (template.if.initial && !value) {
			target.parentNode.removeChild(target);
			template.if.initial = value;
			return 0;
		}
		if (!template.if.initial && !value) {
			return 0;
		}
		else if (!template.if.initial && value) {
			target.parentNode.insertBefore(template.if.clone,target);
			target = target.previousSibling;
			template.if.initial = value;
			return target;
		}
		return target;
	}
	
}());


"use strict";

(function(){
	window._dill.for_each = function(list,callback){
		var i=0,
			l = list.length;
		for (;i<l;i++) {
			callback(list[i],i);
		}
	}

	window._dill.generate_template = function(ele,type){
		var Template = function(){
			this.value = ele.attributes["dill-"+type].nodeValue;
			this.clone = ele.cloneNode(true);
			this.initial = type === "for" ? 1 : true;
		}
		return new Template();
	}

	window._dill.map_component_attributes = function(component,data){
		this.for_each(component.attributes,function(attr){
			var value = attr.nodeValue;
			if (value.substr(0,1) === "'" && value.substr(value.length-1,1) === "'") {
				data[attr.nodeName] = value.substring(1,value.length-1)
				return;
			}
			if (value === "true" || value === "false") {
				data[attr.nodeName] = value === "true";
				return;
			}
			data[attr.nodeName] = data[this.bracer(value, data._display)];
		}.bind(this));
	}

}());


"use strict";

(function(){

	window._dill.render_element = function(input){
		var target = input.ele,
			template = input.template,
			data = input.data,
			parent = input.parent,
			_if;
		if (template.type === "#text") {
			target.nodeValue = this.bracer(template.value,data);
			return 1;
		}
		if (template.type === "#comment") {
			return 1;
		}
		if (template.hasOwnProperty("if")) {
			_if = this.render_if(target,data,template);
			if (_if === 0) {
				return _if;
			}
			target = _if;
		}
		if (template.hasOwnProperty("for")) {
			return this.render_for(target,data,template,parent);
		}
		if (target.hasAttribute("dill-template")) {
			data._template = target.innerHTML;
			target.innerHTML = typeof data[target.attributes["dill-template"].nodeValue] === "function"
				? data[target.attributes["dill-template"].nodeValue]()
				: data[target.attributes["dill-template"].nodeValue];
			template = this.create_template(target,data);
		}
		if (dill.components[target.nodeName.toLowerCase()]) {
			data = this.create_data_object(dill.components[target.nodeName.toLowerCase()].data,data);
			this.map_component_attributes(target,data);
			if (data.hasOwnProperty("oninit") && typeof data.oninit === "function") {
				data.oninit();
			}
		}
		template.attributes.forEach(function(x){
			var value = typeof data[x.value] === "function"
				? data[x.value]()
				: data[x.value];
			target.setAttribute(x.name,value === undefined ? "" : value);
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
		});
		this.for_each(target.attributes,function(attr){
			if (attr.nodeName.substr(0,1) === "#") {
				this.elements[attr.nodeName.substring(1,attr.nodeName.length)] = target;
			}
		}.bind(this));
		(function(){
			var index = 0;
			template.childs.forEach((function(x,i){
				index += this.render_element({
					ele: target.childNodes[index],
					data: data,
					template: x,
					parent: target
				});
			}).bind(this));
		}.apply(this));
		return 1;
	}
	
}());


"use strict";

(function(){
	window._dill.generate_service = function(name,input){
		dill.services[name] = typeof input === "function"
			? (new input())
			: input;
	};
}());


"use strict";

(function(){

	var renders = [];
	var _ref = window._dill;

	window._dill.components = {};
	window._dill.services = {};
	window._dill.elements = {};

	var Dill = function(){
		this.render = function(ele,data){
			var template = this.create_template(ele,data);
			renders.push({ele:ele,data:data,template:template});
			this.render_element({ele:ele,template:template,data:data});
		};
		this.change = function(event){
			event && event();
			_ref.elements = {};
			renders.forEach((function(x){
				this.render_element({ele:x.ele,template:x.template,data:x.data});
			}).bind(this));
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

	Dill.prototype = window._dill;
	window.dill = new Dill();
	delete window._dill;
}());

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFfaW5pdC5qcyIsImJyYWNlci5qcyIsImNvbXBvbmVudC5qcyIsImNvbXBvc2UtY29tcG9uZW50cy5qcyIsImNyZWF0ZS1hdHRyaWJ1dGVzLmpzIiwiY3JlYXRlLXRlbXBsYXRlLmpzIiwiY3JlYXRlX2RhdGFfb2JqZWN0LmpzIiwiZm9yLmpzIiwiaWYuanMiLCJtaXNjLmpzIiwicmVuZGVyLWVsZW1lbnQuanMiLCJzZXJ2aWNlLmpzIiwiel9tYWluLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNoREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMzQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzNDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDckNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDOUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJkaWxsLmpzIiwic291cmNlc0NvbnRlbnQiOlsiXHJcblwidXNlIHN0cmljdFwiO1xyXG5cclxuKGZ1bmN0aW9uKCl7XHJcblx0d2luZG93Ll9kaWxsID0ge307XHJcbn0oKSk7XHJcbiIsIlxyXG5cInVzZSBzdHJpY3RcIjtcclxuXHJcbihmdW5jdGlvbigpe1xyXG5cclxuXHR2YXIgZGVicmFjZXIgPSBmdW5jdGlvbihicmFjZSxkYXRhKXtcclxuXHRcdHZhciB2YWx1ZSA9IHR5cGVvZiBkYXRhW2JyYWNlXSA9PT0gXCJmdW5jdGlvblwiXHJcblx0XHRcdD8gZGF0YVticmFjZV0oKVxyXG5cdFx0XHQ6IGRhdGFbYnJhY2VdO1xyXG5cdFx0cmV0dXJuIHZhbHVlID09PSB1bmRlZmluZWRcclxuXHRcdFx0PyBcIlwiXHJcblx0XHRcdDogdmFsdWU7XHJcblx0fVxyXG5cclxuLy8gRmluZHMgYW55IHZhbHVlcyBpbnNpZGUgYSBzdHJpbmcgb2YgdGV4dCAoZS5nIFwiZXhhbXBsZSB7e3ZhbHVlfX1cIikuIEFuZCB1c2VzIHRoZSBjdXJyZW50IGRhdGEgdG8gZmlsbCBpdCBvdXQuXHJcbi8vIEUuZyBkYXRhIC0+IHt2YWx1ZTpcIk9uZVwifSB0ZXh0IC0+IFwiZXhhbXBsZSB7e3ZhbHVlfX1cIiA9IFwiZXhhbXBsZSBPbmVcIi5cclxuXHR3aW5kb3cuX2RpbGwuYnJhY2VyID0gZnVuY3Rpb24odGV4dCxkYXRhKXtcclxuXHRcdHZhciByZWN1cnNlciA9IGZ1bmN0aW9uKHRleHRfc2VnbWVudCl7XHJcblx0XHRcdHZhciBsZWZ0X2JyYWNlX2luZGV4ID0gdGV4dF9zZWdtZW50LmluZGV4T2YoXCJ7e1wiKSxcclxuXHRcdFx0XHRyaWdodF9icmFjZV9pbmRleCA9IHRleHRfc2VnbWVudC5pbmRleE9mKFwifX1cIik7XHJcblx0XHRcdGlmIChsZWZ0X2JyYWNlX2luZGV4ID09PSAtMSkge1xyXG5cdFx0XHRcdHJldHVybiB0ZXh0X3NlZ21lbnQ7XHJcblx0XHRcdH1cclxuXHRcdFx0aWYgKHJpZ2h0X2JyYWNlX2luZGV4ID09PSAtMSkge1xyXG5cdFx0XHRcdHJldHVybiB0ZXh0X3NlZ21lbnQ7XHJcblx0XHRcdH1cclxuXHRcdFx0cmV0dXJuIHRleHRfc2VnbWVudC5zdWJzdHJpbmcoXHJcblx0XHRcdFx0XHQwLFxyXG5cdFx0XHRcdFx0bGVmdF9icmFjZV9pbmRleFxyXG5cdFx0XHRcdClcclxuXHRcdFx0XHQrIGRlYnJhY2VyKFxyXG5cdFx0XHRcdFx0dGV4dF9zZWdtZW50LnN1YnN0cmluZyhcclxuXHRcdFx0XHRcdFx0bGVmdF9icmFjZV9pbmRleCsyLFxyXG5cdFx0XHRcdFx0XHRyaWdodF9icmFjZV9pbmRleFxyXG5cdFx0XHRcdFx0KSxcclxuXHRcdFx0XHRcdGRhdGFcclxuXHRcdFx0XHQpXHJcblx0XHRcdFx0KyByZWN1cnNlcihcclxuXHRcdFx0XHRcdHRleHRfc2VnbWVudC5zdWJzdHJpbmcoXHJcblx0XHRcdFx0XHRcdHJpZ2h0X2JyYWNlX2luZGV4KzIsXHJcblx0XHRcdFx0XHRcdHRleHRfc2VnbWVudC5sZW5ndGhcclxuXHRcdFx0XHRcdClcclxuXHRcdFx0XHQpO1xyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIHJlY3Vyc2VyKHRleHQpO1xyXG5cdH1cclxuXHRcclxufSgpKTtcclxuIiwiXHJcblwidXNlIHN0cmljdFwiO1xyXG5cclxuKGZ1bmN0aW9uKCl7XHJcblxyXG5cdHZhciBDb21wb25lbnQgPSBmdW5jdGlvbihuYW1lLGRhdGEsdGVtcGxhdGUpe1xyXG5cdFx0dGhpcy5uYW1lID0gbmFtZTtcclxuXHRcdHRoaXMuZGF0YSA9IGRhdGE7XHJcblx0XHR0aGlzLnRlbXBsYXRlID0gdGVtcGxhdGU7XHJcblx0fVxyXG5cclxuXHR3aW5kb3cuX2RpbGwuZ2VuZXJhdGVfY29tcG9uZW50ID0gZnVuY3Rpb24obmFtZSxkYXRhLHRlbXBsYXRlX2xpdGVyYWwpe1xyXG5cdFx0dGhpcy5jb21wb25lbnRzW25hbWVdID0gbmV3IENvbXBvbmVudChuYW1lLGRhdGEsdGVtcGxhdGVfbGl0ZXJhbCk7XHJcblx0fTtcclxuXHJcbn0oKSk7XHJcbiIsIlxyXG5cclxuXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG4oZnVuY3Rpb24oKXtcclxuXHR3aW5kb3cuX2RpbGwuY29tcG9zZV9jb21wb25lbnRzID0gZnVuY3Rpb24oZWxlbWVudCxkYXRhLHR5cGUpe1xyXG5cdFx0aWYgKGVsZW1lbnQubm9kZU5hbWUgPT09IFwiI3RleHRcIiB8fCBlbGVtZW50Lm5vZGVOYW1lID09PSBcIiNjb21tZW50XCIpIHtcclxuXHRcdFx0cmV0dXJuIGVsZW1lbnQ7XHJcblx0XHR9XHJcblx0XHRpZiAoZWxlbWVudC5oYXNBdHRyaWJ1dGUoXCJkaWxsLWZvclwiKSAmJiAhdHlwZSkge1xyXG5cdFx0XHRkYXRhID0gZGF0YVtlbGVtZW50LmF0dHJpYnV0ZXNbXCJkaWxsLWZvclwiXS5ub2RlVmFsdWVdXHJcblx0XHRcdFx0PyB0aGlzLmNyZWF0ZV9kYXRhX29iamVjdChkYXRhW2VsZW1lbnQuYXR0cmlidXRlc1tcImRpbGwtZm9yXCJdLm5vZGVWYWx1ZV1bMF0sIGRhdGEsIDApXHJcblx0XHRcdFx0OiBkYXRhO1xyXG5cdFx0fVxyXG5cdFx0aWYgKGRpbGwuY29tcG9uZW50c1tlbGVtZW50Lm5vZGVOYW1lLnRvTG93ZXJDYXNlKCldKSB7XHJcblx0XHRcdGVsZW1lbnQuaW5uZXJIVE1MID0gZGlsbC5jb21wb25lbnRzW2VsZW1lbnQubm9kZU5hbWUudG9Mb3dlckNhc2UoKV0udGVtcGxhdGU7XHJcblx0XHRcdGRhdGEgPSB0aGlzLmNyZWF0ZV9kYXRhX29iamVjdChkaWxsLmNvbXBvbmVudHNbZWxlbWVudC5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpXS5kYXRhLCBkYXRhKTtcclxuXHRcdH1cclxuXHRcdHRoaXMuY3JlYXRlX2V2ZW50cyhlbGVtZW50LGRhdGEpO1xyXG5cdFx0dGhpcy5mb3JfZWFjaChlbGVtZW50LmNoaWxkTm9kZXMsZnVuY3Rpb24oeCl7XHJcblx0XHRcdHRoaXMuY29tcG9zZV9jb21wb25lbnRzKHgsZGF0YSk7XHJcblx0XHR9LmJpbmQodGhpcykpO1xyXG5cdFx0cmV0dXJuIGVsZW1lbnQ7XHJcblx0fVxyXG59KCkpO1xyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG4iLCJcclxuXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG4oZnVuY3Rpb24oKXtcclxuXHJcblx0d2luZG93Ll9kaWxsLmNyZWF0ZV9hdHRyaWJ1dGVzID0gZnVuY3Rpb24oZWxlLGRhdGEpe1xyXG5cdFx0dmFyIG91dHB1dCA9IFtdO1xyXG5cdFx0dGhpcy5mb3JfZWFjaChlbGUuYXR0cmlidXRlcyxmdW5jdGlvbihhdHRyKXtcclxuXHRcdFx0dmFyIG5hbWUgPSBhdHRyLm5vZGVOYW1lO1xyXG5cdFx0XHRpZiAobmFtZS5zdWJzdHIoMCwxKSA9PT0gXCJbXCIgJiYgbmFtZS5zdWJzdHIobmFtZS5sZW5ndGgtMSwxKSA9PT0gXCJdXCIpIHtcclxuXHRcdFx0XHRvdXRwdXQucHVzaCh7XHJcblx0XHRcdFx0XHRuYW1lOm5hbWUuc3Vic3RyaW5nKDEsbmFtZS5sZW5ndGgtMSksXHJcblx0XHRcdFx0XHR2YWx1ZTphdHRyLm5vZGVWYWx1ZVxyXG5cdFx0XHRcdH0pO1xyXG5cdFx0XHR9XHJcblx0XHR9LmJpbmQodGhpcykpO1xyXG5cdFx0dGhpcy5jcmVhdGVfZXZlbnRzKGVsZSxkYXRhKTtcclxuXHRcdHJldHVybiBvdXRwdXQ7XHJcblx0fVxyXG5cclxuXHR3aW5kb3cuX2RpbGwuY3JlYXRlX2V2ZW50cyA9IGZ1bmN0aW9uKGVsZSxkYXRhKSB7XHJcblx0XHR0aGlzLmZvcl9lYWNoKGVsZS5hdHRyaWJ1dGVzLGZ1bmN0aW9uKGF0dHIpe1xyXG5cdFx0XHR2YXIgbmFtZSA9IGF0dHIubm9kZU5hbWUsXHJcblx0XHRcdFx0ZXZlbnRfbmFtZTtcclxuXHRcdFx0aWYgKG5hbWUuc3Vic3RyKDAsMSkgPT09IFwiKFwiICYmIG5hbWUuc3Vic3RyKG5hbWUubGVuZ3RoLTEsMSkgPT09IFwiKVwiKSB7XHJcblx0XHRcdFx0ZXZlbnRfbmFtZSA9IG5hbWUuc3Vic3RyaW5nKDEsbmFtZS5sZW5ndGgtMSk7XHJcblx0XHRcdFx0ZWxlLmFkZEV2ZW50TGlzdGVuZXIoZXZlbnRfbmFtZSxmdW5jdGlvbihldmVudCl7XHJcblx0XHRcdFx0XHR2YXIgcmV0dXJucztcclxuXHRcdFx0XHRcdGlmIChkYXRhW2F0dHIubm9kZVZhbHVlXSA9PT0gdW5kZWZpbmVkKSB7XHJcblx0XHRcdFx0XHRcdGRpbGwuY2hhbmdlKCk7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRlbHNlIHtcclxuXHRcdFx0XHRcdFx0cmV0dXJucyA9IGRhdGFbYXR0ci5ub2RlVmFsdWVdLmFwcGx5KGRhdGEsW2V2ZW50XSk7XHJcblx0XHRcdFx0XHRcdGlmIChyZXR1cm5zICE9PSBmYWxzZSkge1xyXG5cdFx0XHRcdFx0XHRcdGRpbGwuY2hhbmdlKCk7XHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9KTtcclxuXHRcdFx0fVxyXG5cdFx0fS5iaW5kKHRoaXMpKTtcclxuXHR9XHJcblx0XHJcbn0oKSk7XHJcbiIsIlxyXG5cInVzZSBzdHJpY3RcIjtcclxuXHJcbihmdW5jdGlvbigpe1xyXG5cclxuXHR3aW5kb3cuX2RpbGwuY3JlYXRlX3RlbXBsYXRlID0gZnVuY3Rpb24oZWxlLGRhdGEpe1xyXG5cdFx0dmFyIHRlbXBsYXRlID0ge1xyXG5cdFx0XHR0eXBlOiBlbGUubm9kZU5hbWUsXHJcblx0XHRcdHZhbHVlOiBlbGUubm9kZVZhbHVlXHJcblx0XHR9XHJcblx0XHRpZiAoZWxlLm5vZGVOYW1lID09PSBcIiN0ZXh0XCIgfHwgZWxlLm5vZGVOYW1lID09PSBcIiNjb21tZW50XCIpIHtcclxuXHRcdFx0cmV0dXJuIHRlbXBsYXRlO1xyXG5cdFx0fVxyXG5cdFx0aWYgKGVsZS5oYXNBdHRyaWJ1dGUoXCJkaWxsLWlmXCIpKSB7XHJcblx0XHRcdHRlbXBsYXRlLmlmID0gdGhpcy5nZW5lcmF0ZV90ZW1wbGF0ZShlbGUsXCJpZlwiKTtcclxuXHRcdH1cclxuXHRcdGlmIChlbGUuaGFzQXR0cmlidXRlKFwiZGlsbC1mb3JcIikpIHtcclxuXHRcdFx0dGVtcGxhdGUuZm9yID0gdGhpcy5nZW5lcmF0ZV90ZW1wbGF0ZShlbGUsXCJmb3JcIik7XHJcblx0XHRcdGlmIChkYXRhW3RlbXBsYXRlLmZvci52YWx1ZV0pIHtcclxuXHRcdFx0XHRkYXRhID0gdGhpcy5jcmVhdGVfZGF0YV9vYmplY3QoZGF0YVt0ZW1wbGF0ZS5mb3IudmFsdWVdWzBdLGRhdGEsMCk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHRcdGlmIChkaWxsLmNvbXBvbmVudHNbZWxlLm5vZGVOYW1lLnRvTG93ZXJDYXNlKCldKSB7XHJcblx0XHRcdGVsZS5pbm5lckhUTUwgPSBkaWxsLmNvbXBvbmVudHNbZWxlLm5vZGVOYW1lLnRvTG93ZXJDYXNlKCldLnRlbXBsYXRlO1xyXG5cdFx0XHRkYXRhID0gdGhpcy5jcmVhdGVfZGF0YV9vYmplY3QoZGlsbC5jb21wb25lbnRzW2VsZS5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpXS5kYXRhLGRhdGEpO1xyXG5cdFx0fVxyXG5cdFx0dGVtcGxhdGUuYXR0cmlidXRlcyA9IHRoaXMuY3JlYXRlX2F0dHJpYnV0ZXMoZWxlLGRhdGEpO1xyXG5cdFx0aWYgKGVsZS5oYXNBdHRyaWJ1dGUoXCJkaWxsLWZvclwiKSkge1xyXG5cdFx0XHR0ZW1wbGF0ZS5mb3IuY3VycmVudHMgPSBbXHJcblx0XHRcdFx0ZnVuY3Rpb24oKXtcclxuXHRcdFx0XHRcdHZhciBjbG9uZSA9IGVsZS5jbG9uZU5vZGUodHJ1ZSk7XHJcblx0XHRcdFx0XHRjbG9uZS5yZW1vdmVBdHRyaWJ1dGUoXCJkaWxsLWZvclwiKTtcclxuXHRcdFx0XHRcdHJldHVybiB0aGlzLmNyZWF0ZV90ZW1wbGF0ZShjbG9uZSxkYXRhKTtcclxuXHRcdFx0XHR9LmFwcGx5KHRoaXMpXHJcblx0XHRcdF07XHJcblx0XHR9XHJcblx0XHR0ZW1wbGF0ZS5jaGlsZHMgPSBBcnJheS5wcm90b3R5cGUubWFwLmFwcGx5KGVsZS5jaGlsZE5vZGVzLFsoZnVuY3Rpb24oeCl7XHJcblx0XHRcdHJldHVybiB0aGlzLmNyZWF0ZV90ZW1wbGF0ZSh4LGRhdGEpO1xyXG5cdFx0fSkuYmluZCh0aGlzKV0pO1xyXG5cdFx0cmV0dXJuIHRlbXBsYXRlO1xyXG5cdH1cclxuXHRcclxufSgpKTtcclxuIiwiXHJcblwidXNlIHN0cmljdFwiO1xyXG5cclxuKGZ1bmN0aW9uKCl7XHJcblx0d2luZG93Ll9kaWxsLmNyZWF0ZV9kYXRhX29iamVjdCA9IGZ1bmN0aW9uKHRlbXBsYXRlX29iamVjdCxwYXJlbnRfZGF0YSxpbmRleCl7XHJcblx0XHR2YXIgRGF0YSA9IGZ1bmN0aW9uKHRlbXBsYXRlKXtcclxuXHRcdFx0T2JqZWN0LmtleXModGVtcGxhdGUpLmZvckVhY2goKGZ1bmN0aW9uKGtleSl7XHJcblx0XHRcdFx0dGhpc1trZXldID0gdGVtcGxhdGVba2V5XTtcclxuXHRcdFx0fSkuYmluZCh0aGlzKSk7XHJcblx0XHRcdGlmIChpbmRleCAhPT0gdW5kZWZpbmVkKSB7XHJcblx0XHRcdFx0dGhpcy5faXRlbSA9IHRlbXBsYXRlO1xyXG5cdFx0XHRcdHRoaXMuX2luZGV4ID0gaW5kZXg7XHJcblx0XHRcdH1cclxuXHRcdFx0dGhpcy5fZGlzcGxheSA9IHBhcmVudF9kYXRhO1xyXG5cdFx0fVxyXG5cdFx0RGF0YS5wcm90b3R5cGUgPSBwYXJlbnRfZGF0YTtcclxuXHRcdHJldHVybiBuZXcgRGF0YSh0ZW1wbGF0ZV9vYmplY3QpO1xyXG5cdH1cclxufSgpKTtcclxuIiwiXHJcblwidXNlIHN0cmljdFwiO1xyXG5cclxuKGZ1bmN0aW9uKCl7XHJcblxyXG5cdHdpbmRvdy5fZGlsbC5yZW5kZXJfZm9yID0gZnVuY3Rpb24odGFyZ2V0LGRhdGEsdGVtcGxhdGUscGFyZW50KXtcclxuXHRcdHZhciB0YXJnZXRfZW5kX2ZvciA9IHRhcmdldDtcclxuXHRcdGlmICghZGF0YVt0ZW1wbGF0ZS5mb3IudmFsdWVdKSB7XHJcblx0XHRcdHRhcmdldC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHRhcmdldCk7XHJcblx0XHRcdHRlbXBsYXRlLmZvci5jdXJyZW50cyA9IFtdO1xyXG5cdFx0XHRyZXR1cm4gMDtcclxuXHRcdH1cclxuXHRcdGlmICh0ZW1wbGF0ZS5mb3IuaW5pdGlhbCA8IGRhdGFbdGVtcGxhdGUuZm9yLnZhbHVlXS5sZW5ndGgpIHtcclxuXHRcdFx0Zm9yICh2YXIgaT0xO2k8dGVtcGxhdGUuZm9yLmluaXRpYWw7aSsrKSB7XHJcblx0XHRcdFx0dGFyZ2V0X2VuZF9mb3IgPSB0YXJnZXRfZW5kX2Zvci5uZXh0RWxlbWVudFNpYmxpbmc7XHJcblx0XHRcdH1cclxuXHRcdFx0dmFyIF9qPTA7XHJcblx0XHRcdHZhciBsPWRhdGFbdGVtcGxhdGUuZm9yLnZhbHVlXS5sZW5ndGg7XHJcblx0XHRcdGZvciAoaT10ZW1wbGF0ZS5mb3IuaW5pdGlhbDtpPGw7aSsrKSB7XHJcblx0XHRcdFx0dmFyIGNvbXBvc2VkID0gdGhpcy5jb21wb3NlX2NvbXBvbmVudHMoXHJcblx0XHRcdFx0XHR0ZW1wbGF0ZS5mb3IuY2xvbmUuY2xvbmVOb2RlKHRydWUpLFxyXG5cdFx0XHRcdFx0dGhpcy5jcmVhdGVfZGF0YV9vYmplY3QoZGF0YVt0ZW1wbGF0ZS5mb3IudmFsdWVdW2wtMS1fal0sIGRhdGEsIGwtMS1faiksXHJcblx0XHRcdFx0XHR0cnVlXHJcblx0XHRcdFx0KTtcclxuXHRcdFx0XHRfaisrO1xyXG5cdFx0XHRcdGlmICh0ZW1wbGF0ZS5mb3IuaW5pdGlhbCA+IDApIHtcclxuXHRcdFx0XHRcdHRhcmdldF9lbmRfZm9yLmluc2VydEFkamFjZW50RWxlbWVudChcImFmdGVyZW5kXCIsIGNvbXBvc2VkKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0ZWxzZSB7XHJcblx0XHRcdFx0XHRwYXJlbnQuaW5zZXJ0QmVmb3JlKGNvbXBvc2VkLCB0YXJnZXQpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHR2YXIgaiA9IHRlbXBsYXRlLmZvci5pbml0aWFsID4gMFxyXG5cdFx0XHRcdFx0PyB0YXJnZXRfZW5kX2Zvci5uZXh0RWxlbWVudFNpYmxpbmdcclxuXHRcdFx0XHRcdDogdGFyZ2V0X2VuZF9mb3IucHJldmlvdXNFbGVtZW50U2libGluZztcclxuXHRcdFx0XHR0ZW1wbGF0ZS5mb3IuY3VycmVudHMucHVzaChcclxuXHRcdFx0XHRcdGZ1bmN0aW9uKCl7XHJcblx0XHRcdFx0XHRcdHZhciBjbG9uZSA9IHRlbXBsYXRlLmZvci5jbG9uZS5jbG9uZU5vZGUodHJ1ZSk7XHJcblx0XHRcdFx0XHRcdGNsb25lLnJlbW92ZUF0dHJpYnV0ZShcImRpbGwtZm9yXCIpO1xyXG5cdFx0XHRcdFx0XHRyZXR1cm4gdGhpcy5jcmVhdGVfdGVtcGxhdGUoY2xvbmUsZGF0YSk7XHJcblx0XHRcdFx0XHR9LmFwcGx5KHRoaXMpXHJcblx0XHRcdFx0KTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0ZWxzZSBpZiAodGVtcGxhdGUuZm9yLmluaXRpYWwgPiBkYXRhW3RlbXBsYXRlLmZvci52YWx1ZV0ubGVuZ3RoKSB7XHJcblx0XHRcdGZvciAodmFyIGk9MTtpPGRhdGFbdGVtcGxhdGUuZm9yLnZhbHVlXS5sZW5ndGg7aSsrKSB7XHJcblx0XHRcdFx0dGFyZ2V0X2VuZF9mb3IgPSB0YXJnZXRfZW5kX2Zvci5uZXh0RWxlbWVudFNpYmxpbmc7XHJcblx0XHRcdH1cclxuXHRcdFx0Zm9yIChpPTA7aTx0ZW1wbGF0ZS5mb3IuaW5pdGlhbC1kYXRhW3RlbXBsYXRlLmZvci52YWx1ZV0ubGVuZ3RoO2krKykge1xyXG5cdFx0XHRcdHRhcmdldF9lbmRfZm9yLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoXHJcblx0XHRcdFx0XHR0ZW1wbGF0ZS5mb3IuaW5pdGlhbCA9PT0gMVxyXG5cdFx0XHRcdFx0XHQ/IHRhcmdldF9lbmRfZm9yXHJcblx0XHRcdFx0XHRcdDogdGFyZ2V0X2VuZF9mb3IubmV4dEVsZW1lbnRTaWJsaW5nXHJcblx0XHRcdFx0XHQpO1xyXG5cdFx0XHRcdHRlbXBsYXRlLmZvci5jdXJyZW50cy5wb3AoKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0dGFyZ2V0X2VuZF9mb3IgPSB0ZW1wbGF0ZS5mb3IuaW5pdGlhbCA+IDBcclxuXHRcdFx0PyB0YXJnZXRcclxuXHRcdFx0OiB0YXJnZXQucHJldmlvdXNFbGVtZW50U2libGluZztcclxuXHRcdHRlbXBsYXRlLmZvci5pbml0aWFsID0gZGF0YVt0ZW1wbGF0ZS5mb3IudmFsdWVdLmxlbmd0aDtcclxuXHRcdGZvciAodmFyIGk9MDtpPHRlbXBsYXRlLmZvci5pbml0aWFsO2krKykge1xyXG5cdFx0XHR0aGlzLnJlbmRlcl9lbGVtZW50KFxyXG5cdFx0XHRcdHtcclxuXHRcdFx0XHRcdGVsZTogdGFyZ2V0X2VuZF9mb3IsXHJcblx0XHRcdFx0XHRkYXRhOiB0aGlzLmNyZWF0ZV9kYXRhX29iamVjdChkYXRhW3RlbXBsYXRlLmZvci52YWx1ZV1baV0sZGF0YSxpKSxcclxuXHRcdFx0XHRcdHRlbXBsYXRlOiB0ZW1wbGF0ZS5mb3IuY3VycmVudHNbaV1cclxuXHRcdFx0XHR9XHJcblx0XHRcdCk7XHJcblx0XHRcdHRhcmdldF9lbmRfZm9yID0gdGFyZ2V0X2VuZF9mb3IubmV4dEVsZW1lbnRTaWJsaW5nO1xyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIHRlbXBsYXRlLmZvci5pbml0aWFsO1xyXG5cdH1cclxuXHRcclxufSgpKTtcclxuIiwiXHJcblwidXNlIHN0cmljdFwiO1xyXG5cclxuKGZ1bmN0aW9uKCl7XHJcblxyXG5cdHdpbmRvdy5fZGlsbC5yZW5kZXJfaWYgPSBmdW5jdGlvbih0YXJnZXQsZGF0YSx0ZW1wbGF0ZSl7XHJcblx0XHR2YXIgdmFsdWUgPSB0eXBlb2YgZGF0YVt0ZW1wbGF0ZS5pZi52YWx1ZV0gPT09IFwiZnVuY3Rpb25cIlxyXG5cdFx0XHQ/IGRhdGFbdGVtcGxhdGUuaWYudmFsdWVdKClcclxuXHRcdFx0OiBkYXRhW3RlbXBsYXRlLmlmLnZhbHVlXTtcclxuXHRcdGlmICh0ZW1wbGF0ZS5pZi5pbml0aWFsICYmICF2YWx1ZSkge1xyXG5cdFx0XHR0YXJnZXQucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0YXJnZXQpO1xyXG5cdFx0XHR0ZW1wbGF0ZS5pZi5pbml0aWFsID0gdmFsdWU7XHJcblx0XHRcdHJldHVybiAwO1xyXG5cdFx0fVxyXG5cdFx0aWYgKCF0ZW1wbGF0ZS5pZi5pbml0aWFsICYmICF2YWx1ZSkge1xyXG5cdFx0XHRyZXR1cm4gMDtcclxuXHRcdH1cclxuXHRcdGVsc2UgaWYgKCF0ZW1wbGF0ZS5pZi5pbml0aWFsICYmIHZhbHVlKSB7XHJcblx0XHRcdHRhcmdldC5wYXJlbnROb2RlLmluc2VydEJlZm9yZSh0ZW1wbGF0ZS5pZi5jbG9uZSx0YXJnZXQpO1xyXG5cdFx0XHR0YXJnZXQgPSB0YXJnZXQucHJldmlvdXNTaWJsaW5nO1xyXG5cdFx0XHR0ZW1wbGF0ZS5pZi5pbml0aWFsID0gdmFsdWU7XHJcblx0XHRcdHJldHVybiB0YXJnZXQ7XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gdGFyZ2V0O1xyXG5cdH1cclxuXHRcclxufSgpKTtcclxuIiwiXHJcblwidXNlIHN0cmljdFwiO1xyXG5cclxuKGZ1bmN0aW9uKCl7XHJcblx0d2luZG93Ll9kaWxsLmZvcl9lYWNoID0gZnVuY3Rpb24obGlzdCxjYWxsYmFjayl7XHJcblx0XHR2YXIgaT0wLFxyXG5cdFx0XHRsID0gbGlzdC5sZW5ndGg7XHJcblx0XHRmb3IgKDtpPGw7aSsrKSB7XHJcblx0XHRcdGNhbGxiYWNrKGxpc3RbaV0saSk7XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHR3aW5kb3cuX2RpbGwuZ2VuZXJhdGVfdGVtcGxhdGUgPSBmdW5jdGlvbihlbGUsdHlwZSl7XHJcblx0XHR2YXIgVGVtcGxhdGUgPSBmdW5jdGlvbigpe1xyXG5cdFx0XHR0aGlzLnZhbHVlID0gZWxlLmF0dHJpYnV0ZXNbXCJkaWxsLVwiK3R5cGVdLm5vZGVWYWx1ZTtcclxuXHRcdFx0dGhpcy5jbG9uZSA9IGVsZS5jbG9uZU5vZGUodHJ1ZSk7XHJcblx0XHRcdHRoaXMuaW5pdGlhbCA9IHR5cGUgPT09IFwiZm9yXCIgPyAxIDogdHJ1ZTtcclxuXHRcdH1cclxuXHRcdHJldHVybiBuZXcgVGVtcGxhdGUoKTtcclxuXHR9XHJcblxyXG5cdHdpbmRvdy5fZGlsbC5tYXBfY29tcG9uZW50X2F0dHJpYnV0ZXMgPSBmdW5jdGlvbihjb21wb25lbnQsZGF0YSl7XHJcblx0XHR0aGlzLmZvcl9lYWNoKGNvbXBvbmVudC5hdHRyaWJ1dGVzLGZ1bmN0aW9uKGF0dHIpe1xyXG5cdFx0XHR2YXIgdmFsdWUgPSBhdHRyLm5vZGVWYWx1ZTtcclxuXHRcdFx0aWYgKHZhbHVlLnN1YnN0cigwLDEpID09PSBcIidcIiAmJiB2YWx1ZS5zdWJzdHIodmFsdWUubGVuZ3RoLTEsMSkgPT09IFwiJ1wiKSB7XHJcblx0XHRcdFx0ZGF0YVthdHRyLm5vZGVOYW1lXSA9IHZhbHVlLnN1YnN0cmluZygxLHZhbHVlLmxlbmd0aC0xKVxyXG5cdFx0XHRcdHJldHVybjtcclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAodmFsdWUgPT09IFwidHJ1ZVwiIHx8IHZhbHVlID09PSBcImZhbHNlXCIpIHtcclxuXHRcdFx0XHRkYXRhW2F0dHIubm9kZU5hbWVdID0gdmFsdWUgPT09IFwidHJ1ZVwiO1xyXG5cdFx0XHRcdHJldHVybjtcclxuXHRcdFx0fVxyXG5cdFx0XHRkYXRhW2F0dHIubm9kZU5hbWVdID0gZGF0YVt0aGlzLmJyYWNlcih2YWx1ZSwgZGF0YS5fZGlzcGxheSldO1xyXG5cdFx0fS5iaW5kKHRoaXMpKTtcclxuXHR9XHJcblxyXG59KCkpO1xyXG4iLCJcclxuXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG4oZnVuY3Rpb24oKXtcclxuXHJcblx0d2luZG93Ll9kaWxsLnJlbmRlcl9lbGVtZW50ID0gZnVuY3Rpb24oaW5wdXQpe1xyXG5cdFx0dmFyIHRhcmdldCA9IGlucHV0LmVsZSxcclxuXHRcdFx0dGVtcGxhdGUgPSBpbnB1dC50ZW1wbGF0ZSxcclxuXHRcdFx0ZGF0YSA9IGlucHV0LmRhdGEsXHJcblx0XHRcdHBhcmVudCA9IGlucHV0LnBhcmVudCxcclxuXHRcdFx0X2lmO1xyXG5cdFx0aWYgKHRlbXBsYXRlLnR5cGUgPT09IFwiI3RleHRcIikge1xyXG5cdFx0XHR0YXJnZXQubm9kZVZhbHVlID0gdGhpcy5icmFjZXIodGVtcGxhdGUudmFsdWUsZGF0YSk7XHJcblx0XHRcdHJldHVybiAxO1xyXG5cdFx0fVxyXG5cdFx0aWYgKHRlbXBsYXRlLnR5cGUgPT09IFwiI2NvbW1lbnRcIikge1xyXG5cdFx0XHRyZXR1cm4gMTtcclxuXHRcdH1cclxuXHRcdGlmICh0ZW1wbGF0ZS5oYXNPd25Qcm9wZXJ0eShcImlmXCIpKSB7XHJcblx0XHRcdF9pZiA9IHRoaXMucmVuZGVyX2lmKHRhcmdldCxkYXRhLHRlbXBsYXRlKTtcclxuXHRcdFx0aWYgKF9pZiA9PT0gMCkge1xyXG5cdFx0XHRcdHJldHVybiBfaWY7XHJcblx0XHRcdH1cclxuXHRcdFx0dGFyZ2V0ID0gX2lmO1xyXG5cdFx0fVxyXG5cdFx0aWYgKHRlbXBsYXRlLmhhc093blByb3BlcnR5KFwiZm9yXCIpKSB7XHJcblx0XHRcdHJldHVybiB0aGlzLnJlbmRlcl9mb3IodGFyZ2V0LGRhdGEsdGVtcGxhdGUscGFyZW50KTtcclxuXHRcdH1cclxuXHRcdGlmICh0YXJnZXQuaGFzQXR0cmlidXRlKFwiZGlsbC10ZW1wbGF0ZVwiKSkge1xyXG5cdFx0XHRkYXRhLl90ZW1wbGF0ZSA9IHRhcmdldC5pbm5lckhUTUw7XHJcblx0XHRcdHRhcmdldC5pbm5lckhUTUwgPSB0eXBlb2YgZGF0YVt0YXJnZXQuYXR0cmlidXRlc1tcImRpbGwtdGVtcGxhdGVcIl0ubm9kZVZhbHVlXSA9PT0gXCJmdW5jdGlvblwiXHJcblx0XHRcdFx0PyBkYXRhW3RhcmdldC5hdHRyaWJ1dGVzW1wiZGlsbC10ZW1wbGF0ZVwiXS5ub2RlVmFsdWVdKClcclxuXHRcdFx0XHQ6IGRhdGFbdGFyZ2V0LmF0dHJpYnV0ZXNbXCJkaWxsLXRlbXBsYXRlXCJdLm5vZGVWYWx1ZV07XHJcblx0XHRcdHRlbXBsYXRlID0gdGhpcy5jcmVhdGVfdGVtcGxhdGUodGFyZ2V0LGRhdGEpO1xyXG5cdFx0fVxyXG5cdFx0aWYgKGRpbGwuY29tcG9uZW50c1t0YXJnZXQubm9kZU5hbWUudG9Mb3dlckNhc2UoKV0pIHtcclxuXHRcdFx0ZGF0YSA9IHRoaXMuY3JlYXRlX2RhdGFfb2JqZWN0KGRpbGwuY29tcG9uZW50c1t0YXJnZXQubm9kZU5hbWUudG9Mb3dlckNhc2UoKV0uZGF0YSxkYXRhKTtcclxuXHRcdFx0dGhpcy5tYXBfY29tcG9uZW50X2F0dHJpYnV0ZXModGFyZ2V0LGRhdGEpO1xyXG5cdFx0XHRpZiAoZGF0YS5oYXNPd25Qcm9wZXJ0eShcIm9uaW5pdFwiKSAmJiB0eXBlb2YgZGF0YS5vbmluaXQgPT09IFwiZnVuY3Rpb25cIikge1xyXG5cdFx0XHRcdGRhdGEub25pbml0KCk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHRcdHRlbXBsYXRlLmF0dHJpYnV0ZXMuZm9yRWFjaChmdW5jdGlvbih4KXtcclxuXHRcdFx0dmFyIHZhbHVlID0gdHlwZW9mIGRhdGFbeC52YWx1ZV0gPT09IFwiZnVuY3Rpb25cIlxyXG5cdFx0XHRcdD8gZGF0YVt4LnZhbHVlXSgpXHJcblx0XHRcdFx0OiBkYXRhW3gudmFsdWVdO1xyXG5cdFx0XHR0YXJnZXQuc2V0QXR0cmlidXRlKHgubmFtZSx2YWx1ZSA9PT0gdW5kZWZpbmVkID8gXCJcIiA6IHZhbHVlKTtcclxuXHRcdFx0aWYgKHgubmFtZSA9PT0gXCJ2YWx1ZVwiKSB7XHJcblx0XHRcdFx0c2V0VGltZW91dChmdW5jdGlvbigpe1xyXG5cdFx0XHRcdFx0aWYgKHZhbHVlICE9PSB1bmRlZmluZWQpIHtcclxuXHRcdFx0XHRcdFx0dGFyZ2V0LnZhbHVlID0gdmFsdWU7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fSwwKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAoIXZhbHVlKSB7XHJcblx0XHRcdFx0dGFyZ2V0LnJlbW92ZUF0dHJpYnV0ZSh4Lm5hbWUpO1xyXG5cdFx0XHR9XHJcblx0XHR9KTtcclxuXHRcdHRoaXMuZm9yX2VhY2godGFyZ2V0LmF0dHJpYnV0ZXMsZnVuY3Rpb24oYXR0cil7XHJcblx0XHRcdGlmIChhdHRyLm5vZGVOYW1lLnN1YnN0cigwLDEpID09PSBcIiNcIikge1xyXG5cdFx0XHRcdHRoaXMuZWxlbWVudHNbYXR0ci5ub2RlTmFtZS5zdWJzdHJpbmcoMSxhdHRyLm5vZGVOYW1lLmxlbmd0aCldID0gdGFyZ2V0O1xyXG5cdFx0XHR9XHJcblx0XHR9LmJpbmQodGhpcykpO1xyXG5cdFx0KGZ1bmN0aW9uKCl7XHJcblx0XHRcdHZhciBpbmRleCA9IDA7XHJcblx0XHRcdHRlbXBsYXRlLmNoaWxkcy5mb3JFYWNoKChmdW5jdGlvbih4LGkpe1xyXG5cdFx0XHRcdGluZGV4ICs9IHRoaXMucmVuZGVyX2VsZW1lbnQoe1xyXG5cdFx0XHRcdFx0ZWxlOiB0YXJnZXQuY2hpbGROb2Rlc1tpbmRleF0sXHJcblx0XHRcdFx0XHRkYXRhOiBkYXRhLFxyXG5cdFx0XHRcdFx0dGVtcGxhdGU6IHgsXHJcblx0XHRcdFx0XHRwYXJlbnQ6IHRhcmdldFxyXG5cdFx0XHRcdH0pO1xyXG5cdFx0XHR9KS5iaW5kKHRoaXMpKTtcclxuXHRcdH0uYXBwbHkodGhpcykpO1xyXG5cdFx0cmV0dXJuIDE7XHJcblx0fVxyXG5cdFxyXG59KCkpO1xyXG4iLCJcclxuXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG4oZnVuY3Rpb24oKXtcclxuXHR3aW5kb3cuX2RpbGwuZ2VuZXJhdGVfc2VydmljZSA9IGZ1bmN0aW9uKG5hbWUsaW5wdXQpe1xyXG5cdFx0ZGlsbC5zZXJ2aWNlc1tuYW1lXSA9IHR5cGVvZiBpbnB1dCA9PT0gXCJmdW5jdGlvblwiXHJcblx0XHRcdD8gKG5ldyBpbnB1dCgpKVxyXG5cdFx0XHQ6IGlucHV0O1xyXG5cdH07XHJcbn0oKSk7XHJcbiIsIlxyXG5cInVzZSBzdHJpY3RcIjtcclxuXHJcbihmdW5jdGlvbigpe1xyXG5cclxuXHR2YXIgcmVuZGVycyA9IFtdO1xyXG5cdHZhciBfcmVmID0gd2luZG93Ll9kaWxsO1xyXG5cclxuXHR3aW5kb3cuX2RpbGwuY29tcG9uZW50cyA9IHt9O1xyXG5cdHdpbmRvdy5fZGlsbC5zZXJ2aWNlcyA9IHt9O1xyXG5cdHdpbmRvdy5fZGlsbC5lbGVtZW50cyA9IHt9O1xyXG5cclxuXHR2YXIgRGlsbCA9IGZ1bmN0aW9uKCl7XHJcblx0XHR0aGlzLnJlbmRlciA9IGZ1bmN0aW9uKGVsZSxkYXRhKXtcclxuXHRcdFx0dmFyIHRlbXBsYXRlID0gdGhpcy5jcmVhdGVfdGVtcGxhdGUoZWxlLGRhdGEpO1xyXG5cdFx0XHRyZW5kZXJzLnB1c2goe2VsZTplbGUsZGF0YTpkYXRhLHRlbXBsYXRlOnRlbXBsYXRlfSk7XHJcblx0XHRcdHRoaXMucmVuZGVyX2VsZW1lbnQoe2VsZTplbGUsdGVtcGxhdGU6dGVtcGxhdGUsZGF0YTpkYXRhfSk7XHJcblx0XHR9O1xyXG5cdFx0dGhpcy5jaGFuZ2UgPSBmdW5jdGlvbihldmVudCl7XHJcblx0XHRcdGV2ZW50ICYmIGV2ZW50KCk7XHJcblx0XHRcdF9yZWYuZWxlbWVudHMgPSB7fTtcclxuXHRcdFx0cmVuZGVycy5mb3JFYWNoKChmdW5jdGlvbih4KXtcclxuXHRcdFx0XHR0aGlzLnJlbmRlcl9lbGVtZW50KHtlbGU6eC5lbGUsdGVtcGxhdGU6eC50ZW1wbGF0ZSxkYXRhOnguZGF0YX0pO1xyXG5cdFx0XHR9KS5iaW5kKHRoaXMpKTtcclxuXHRcdH07XHJcblx0XHR0aGlzLmNvbXBvbmVudCA9IHdpbmRvdy5fZGlsbC5nZW5lcmF0ZV9jb21wb25lbnQ7XHJcblx0XHR0aGlzLnNlcnZpY2UgPSB3aW5kb3cuX2RpbGwuZ2VuZXJhdGVfc2VydmljZTtcclxuXHRcdHRoaXMuYnViYmxlX2NoYW5nZSA9IGZ1bmN0aW9uKGRhdGEsdGFyZ2V0LHZhbHVlKXtcclxuXHRcdFx0dmFyIHJlY3Vyc2VyID0gZnVuY3Rpb24oZGF0YSx0YXJnZXQsdmFsdWUpe1xyXG5cdFx0XHRcdGlmIChkYXRhLmhhc093blByb3BlcnR5KHRhcmdldCkpIHtcclxuXHRcdFx0XHRcdGRhdGFbdGFyZ2V0XSA9IHZhbHVlO1xyXG5cdFx0XHRcdFx0cmV0dXJuO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRpZiAoZGF0YS5oYXNPd25Qcm9wZXJ0eShcIl9kaXNwbGF5XCIpKSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gcmVjdXJzZXIoZGF0YS5fZGlzcGxheSx0YXJnZXQsdmFsdWUpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0XHRyZWN1cnNlcihkYXRhLHRhcmdldCx2YWx1ZSk7XHJcblx0XHR9XHJcblx0fTtcclxuXHJcblx0RGlsbC5wcm90b3R5cGUgPSB3aW5kb3cuX2RpbGw7XHJcblx0d2luZG93LmRpbGwgPSBuZXcgRGlsbCgpO1xyXG5cdGRlbGV0ZSB3aW5kb3cuX2RpbGw7XHJcbn0oKSk7XHJcbiJdfQ==
