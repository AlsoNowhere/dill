
import { forEach } from "./for-each";

export var recurseComponent = function(template,type){
	if (template.component && template.data.hasOwnProperty(type) && typeof template.data[type] === "function") {
		template.data[type]();
	}
	template.children && forEach(template.children,function(x){
		recurseComponent(x,type);
	});
}
