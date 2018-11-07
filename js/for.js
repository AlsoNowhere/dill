
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
