
import { Component } from "./Component.model";

export const DillElement = function(
    element,
    attributes,
    childTemplates
){

/*
    A dill element can either be a Component or a HTML element.
    e.g
    <Component />
    or
    <div></div>
    We check for which one this is below.
*/
    if (typeof element === "string") {
        this.nodeName = element;
    }
    else if (element instanceof Function) {
        this.Component = element;
    }

    this.attributes = attributes;

    this.childTemplates = (
        childTemplates instanceof Array
            ? childTemplates
            : [childTemplates]
    );

    Object.freeze(this);
}
