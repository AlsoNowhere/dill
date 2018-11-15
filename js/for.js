
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
