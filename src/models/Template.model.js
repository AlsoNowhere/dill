
import { Component } from "./Component.model";

export const Template = function(
    rootElement,
    element,
    data,
    attributesOrTextValue = null,
    dillAttributes = {}
){
    this.rootElement = rootElement;

    if (element instanceof Text) {
        this.textNode = element;
        this.textValue = attributesOrTextValue;
    }
    else if (element instanceof Element) {
        this.htmlElement = element;
        attributesOrTextValue !== null && (this.attributes = attributesOrTextValue);
    }
    else if (element.Component && element.Component.component instanceof Component) {
        this.Component = element;
        attributesOrTextValue !== null && (this.attributes = attributesOrTextValue);
    }

    this.data = data;
    this.childTemplates = [];

    dillAttributes.dillIf && (this.dillIf = dillAttributes.dillIf);
    dillAttributes.dillFor && (this.dillFor = dillAttributes.dillFor);
    dillAttributes.dillTemplate && (this.dillTemplate = dillAttributes.dillTemplate);

    Object.seal(this);
}
