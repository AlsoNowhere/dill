
import { forEach } from "../common/for-each";
import { renders } from "./renders";
import { renderTarget } from "../render/render-target";

export var change = function(target){
	forEach(renders, function(template){
		renderTarget(template.target, template.template, target || true);
	});
};
