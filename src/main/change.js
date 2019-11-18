
import { forEach } from "../common/for-each";
import { renders } from "./renders";
import { renderTarget } from "../render/render-target";
import { Render } from "../classes/Render.class";

export var change = function(targetElement){
	forEach(renders, function(render){
		if (!(render instanceof Render)) {
			return;
		}
		renderTarget(
			render.targetElement,
			render.dillTemplate,
			targetElement || true
		);
	});
};
