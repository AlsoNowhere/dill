
import { Module } from "../classes/Module.class";
import { Render } from "../classes/Render.class";
import { renders } from "./renders";
import { change } from "./change";
import { createDillTemplate } from "../template/create-template";
import { createData } from "../common/create-data";
import { logger } from "../common/logger.service";

export var render = function(
	targetElement,
	InitialDataConstructor,
	dillModule
){

	if (!(dillModule instanceof Module)) {
		logger.error("You must pass a Dill Module instance.");
		throw new Error("You must pass a Dill Module instance.");
	}

	if (typeof InitialDataConstructor !== "function") {
		logger.error("You must pass a constructor function as the original Data.");
		throw new Error("You must pass a constructor function as the original Data.");
	}

	if (!(targetElement instanceof Element)) {
		logger.error("You must pass a HTML element as the target.");
		throw new Error("You must pass a HTML element as the target.");
	}

	var data = createData(new InitialDataConstructor(), null);

// Expose the Dill Module on the model. This allows the developer to access the current Dill Module without having to pass it through by other means.
	data._module = dillModule;

// Begin templating the root element.
	var dillTemplate = createDillTemplate(targetElement, data, dillModule);

// OnInit lifecycle method. This runs after templating the root element.
	data.oninit && data.oninit();

	renders.push(
		new Render(targetElement, dillTemplate)
	);

// This function runs the whole dill operation.
	change();

	return data;
}
