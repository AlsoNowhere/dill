
"use strict";

(function(){

	var Template = function(name,data,module){
		this.type = name;
		this.data = data;
		this.module = module;
		this.data._module = module;
		this.data._elements = data._elements || {};
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

// This set for later. It needs to be set here because inside the template_for function it is removed from the element.
// This attribute is removed so that the render function and template function do not get stuck in a loop.
		has_for = target.hasAttribute("dill-for");

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

// If this element is actually a component it will be found and handled as such from here.
// If the function exists handle the component function.
		this.template_component && (function(){
			var _module = this.template_component(target,template,module);
// Overwrite module so that data from this point (i.e inside this component) uses this module.
			if (_module !== undefined) {
				module = dill.modules[_module.name];
				template.data._module = module;
			}
		}.apply(this));
// Run through each attribute
		template.attributes = this.create_attributes(target,template,module,_data);

		(function(){
			var value = template.if && template.data[template.if.value];
			if (!template.component || !template.data.hasOwnProperty("oninit")) {
				return;
			}


			// !(template.if
			// 		&& (
			// 		typeof value === "function"
			// 			? value()
			// 			: value
			// 		)
			// 	)) {


			if (template.if && !(
					typeof value === "function"
						? value()
						: value
					)) {
				return;
			}
			// if (template.component
			// 	&& template.data.hasOwnProperty("oninit")
			// 	&& (template.if
			// 		&& (
			// 		typeof template.data[template.if.value] === "function"
			// 			? template.data[template.if.value]()
			// 			: template.data[template.if.value]
			// 		)
			// 	)
			// 	|| !template.if) {
				template.data.oninit();
			// }
		}());

// For each child element create a new template branch.
		template.childs = Array.prototype.map.apply(target.childNodes,[(function(x){
			return this.create_template(x,template.data,module);
		}).bind(this)]);

		return template;
	}
}());
