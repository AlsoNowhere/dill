import { logger } from "../common/logger.service";

export var ComponentPrototype = function(name,template,module){
    if (typeof name !== "string") {
        logger.error("You must pass a string as the name of the component.");
        throw new Error("You must pass a string as the name of the component.");
    }
    
    if (name.indexOf("\n") > -1) {
        logger.error("You can not put line breaks in the component name.");
        throw new Error("You can not put line breaks in the component name.");
    }

    if (typeof template !== "string") {
        logger.error("You must pass a string as the template of the component.");
        throw new Error("You must pass a string as the template of the component.");
    }

    if (!!module && !(module instanceof Module)) {
        logger.error("You must pass an instance of Module for the module, or leave undefined.");
        throw new Error("You must pass an instance of Module for the module, or leave undefined.");
    }

    this.name = name;
    this.template = template;
}
