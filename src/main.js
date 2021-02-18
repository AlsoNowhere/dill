
import { initiateApp } from "./main/initiate-app.service";
import { change } from "./services/rendering/change.service";

import { DillElement } from "./models/DillElement.model";
import { Component } from "./models/Component.model";

import { site } from "./data/site.data";

export const dill = new function Dill(){

    this.element = function(
        element,
        attributes,
        childTemplate
    ){
        return new DillElement(
            element,
            attributes,
            childTemplate instanceof Array
                ? childTemplate
                : [...arguments].slice(2)
        );
    };

    this.setStrictMode = () => site.strictMode = true;
    this.setDevMode = () => site.devMode = true;
    this.setDoNotRunChangeOnEvents = () => site.runChangeOnEvents = false;

    this.Component = Component;

    this.create = initiateApp;

    this.change = change;
};
