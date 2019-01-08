
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
