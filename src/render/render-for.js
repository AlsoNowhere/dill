
import { Template } from "../classes/template.class";
import { createTemplate } from "../template/create-template";
import { renderTarget } from "./render-target";
import { createData } from "../common/create-data";
import { recycleData } from "../common/recycle-data";
import { recurseComponent } from "../common/recurse-component";

export var renderFor = function(target, template, condition){
	var initialLength = template.for.initial.length;
	var value = typeof template.data[template.for.value] === "function"
		? template.data[template.for.value]()
		: template.data[template.for.value];
	if (value === undefined) {
		throw new Error("Count not find " + template.for.value + " on current scope.");
	}
	var initial = template.for.initial;
	var newLength = value.length;
	var currentTarget = target;
	var parent = template.for.parent;
	var templates = template.for.templates;
	var clone = function(){
		return template.for.clone.cloneNode(true);
	}
	if (initialLength !== newLength) {
		(function(){
			if (initialLength > newLength) {
				(function(){
					var i = 0;
					var next;
					while (i < newLength) {
						currentTarget = currentTarget.nextElementSibling;
						i++;
					}
					while (i < initialLength) {
						next = currentTarget.nextElementSibling;
						parent.removeChild(currentTarget);
						recurseComponent(template,"onremove");
						currentTarget = next;
						i++;
					}
				}());
			}
			if (initialLength < newLength) {
				(function(){
					var i = 0;
					while (i < initialLength - 1) {
						currentTarget = currentTarget.nextElementSibling;
						i++;
					}
					if (initialLength === 0) {
						if (currentTarget === undefined) {
							currentTarget = clone();
							parent.appendChild(currentTarget);
						}
						else {
							parent.insertBefore(clone(), currentTarget);
							currentTarget = currentTarget.previousElementSibling;
						}
						var data = createData(value[0], template.data);
						data._item = value[0];
						data._index = 0;
						(function(){
							var newTemplate = createTemplate(currentTarget, data, template.module, template);
							templates[0] = newTemplate;
							renderTarget(currentTarget, newTemplate, condition);
						}(0));
					}

					while (i < newLength - 1) {
						currentTarget.insertAdjacentElement("afterend", clone());
						currentTarget = currentTarget.nextElementSibling;
						(function(){
							var j = i + 1;
							var data = createData(value[j], template.data);
							data._item = value[j];
							data._index = j;
							var newTemplate = createTemplate(currentTarget, data, template.module, template);
							templates[j] = newTemplate;
							renderTarget(currentTarget, newTemplate, condition);
						}());
						i++;
					}
				}());
			}
		}());
	}

	(function(){
		var i = 0;
		var next;
		currentTarget = target;
		while (i < (initialLength < newLength ? initialLength : newLength)) {
			if (value[i] === initial[i]) {
				if (typeof value[i] === "object") {
					recycleData(value[i], templates[i].data);
				}
				renderTarget(currentTarget, templates[i], condition);
				currentTarget = currentTarget.nextElementSibling;
				i++;
				continue;
			}
			next = currentTarget.nextSibling;
			parent.removeChild(currentTarget);
			recurseComponent(template,"onremove");
			if (next === null) {
				parent.appendChild(clone());
				currentTarget = parent.children[parent.children.length - 1];
			}
			else {
				parent.insertBefore(clone(), next);
				currentTarget = next.previousElementSibling;
			}
			(function(){
				var data = createData(value[i], template.data);
				data._item = value[i];
				data._index = i;
				var newTemplate = createTemplate(currentTarget, data, template.module, template);
				templates[i] = newTemplate;
				renderTarget(currentTarget, newTemplate, condition);
			}());
			currentTarget = currentTarget.nextElementSibling;
			i++;
		}
	}());
	template.for.initial = value.map(function(x){
		return x;
	});
	return newLength;
}
