
import { logger } from "../common/logger.service";
import { ComponentPrototype } from "../classes/ComponentPrototype.class";

export var setComponent = function(component){

	if (!(component instanceof Function)) {
		logger.error("You must pass a constructor function to the .setComponent method on a dill module.");
		throw new Error("You must pass a constructor function to the .setComponent method on a dill module.");
	}

	if (!(component.prototype instanceof ComponentPrototype)) {
		logger.error("You must use an instance of ComponentPrototype for the constructor function prototype.");
		throw new Error("You must use an instance of ComponentPrototype for the constructor function prototype.");
	}

	this.components[component.prototype.name] = component;
};
