
import { forEach } from "sage-library";

import { deBracer } from "../../logic/de-bracer.logic";
import { resolveData } from "../../logic/resolve-data.logic";

import { elementProperties } from "../../data/element-properties.data";

export const renderAttributes = (element, attributes, data) => {

    if (!attributes) {
        return;
    }

    forEach(attributes, attribute => {

        const {name, value, dillAttribute} = attribute;

        const oldValue = elementProperties.includes(name)
            ? element[name]
            : (element.attributes[name] && element.attributes[name].nodeValue);
        const newValue = dillAttribute
            ? resolveData(data, value)
            : deBracer(value, data);

        if (oldValue !== newValue) {
            if (elementProperties.includes(name)) {
                element[name] = newValue;
            }
            else if (newValue === false || newValue === undefined) {
                element.removeAttribute(name);
            }
            else {
                element.setAttribute(name, newValue);
            }
        }
    });
}
