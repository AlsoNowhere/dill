
import { forEach } from "../common/for-each";
import { logger } from "../common/logger.service";
import { Module } from "./Module.model";

export var dillModule = function(name,modulesToExtend){
    var component,
        components = {};
// -- Development only --
    if (name === undefined || typeof name !== "string" || name === "") {
        return logger.error(".module method - name argument","You must pass a name to the module.");
    }
    if (modulesToExtend !== undefined && !(modulesToExtend instanceof Array)) {
        return logger.error(".module method - modules to extend argument","You must pass undefined or an Array.");
    }
// /-- Development only --
    if (modulesToExtend === undefined) {
        modulesToExtend = [];
    }
    forEach(modulesToExtend,function(eachModule){
        for (component in eachModule.components) {
            if (!components[component] && eachModule.components[component].isolated !== true) {
                components[component] = eachModule.components[component];
            }
        }
    });
    return new Module(name,components);
}
