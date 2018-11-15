
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
