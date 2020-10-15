
import { Component } from "./Component.model";

export const Template = function(
    rootTemplate = null,
    elementOrComponent,
    data,
    attributes = null,
    childTemplates = null,
    options = {}
){
    this.rootTemplate = rootTemplate;

    if (elementOrComponent instanceof Node) {
        this.text = elementOrComponent.nodeValue;
        this.element = elementOrComponent;
    }
    else if (elementOrComponent instanceof Element) {
        this.element = elementOrComponent;
    }
    else if (elementOrComponent instanceof Function && elementOrComponent.component instanceof Component) {
        this.Component = elementOrComponent
    }

    this.data = data;

    this.attributes = attributes;

    this.childTemplates = childTemplates;

    if (options.if) {
        this.if = options.if;
    }

    if (options.for) {
        this.for = options.for;
    }

    if (options.dill_template) {
        this.dill_template = options.dill_template;
    }

    Object.seal(this);
};
