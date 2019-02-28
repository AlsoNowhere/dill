"use strict";

(function(){

	window._dill.render_attributes = function(target,template){

		template.attributes && template.attributes.forEach(function(x){
			var value = this.evaluator(x.value,template.data);
			if (!template.component && x.name !== "value") {
				target.setAttribute(
					x.name,
					x.type === "literal"
						? x.value
						: x.type === "bind"
							? value
							: x.type === "default"
								? this.bracer(x.value,template.data)
								: null
				);
			}
			else {
				target.value = value;
			}
		}.bind(this));

	}
}());
