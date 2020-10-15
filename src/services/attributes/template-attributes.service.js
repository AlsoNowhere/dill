
import { forEach } from "sage-library";

import { deBracer } from "../../dill-core/services/de-bracer.service";
import { resolveData } from "../../dill-core/services/resolve-data.service";

import { Attribute } from "../../models/Attribute.model";

import { elementProperties } from "../../data/element-properties.data";

/*
    This function takes an object of attributes and acts in four ways.
     - If the attribute name ends in --- then add this element to the data.
     - If the attribute name ends in -- then add an event to the element.
     - If the attribute name ends in - then this attribute value will be set from a property on the data.
     - Any other valid property (doesn't start with 'dill-') then this is a normal attribute and will be rendered as such.
    Attributes are not added during the template stage but the render stage.
*/
export const templateAttributes = (change, element, attributes, data) => {

    if (!attributes) {
        return [];
    }

    return forEach(Object.entries(attributes), attribute => {
        const [name, value] = attribute;

        if (name.substr(name.length - 3) === "---") {
            data[name.substring(0, name.length - 3)] = element;
            return 0;
        }

        if (name.substr(name.length - 2) === "--") {
            element.addEventListener(name.substring(0, name.length - 2), event => {

                const result = data[value](event, element);
        /*
            Get the result of the function that runs on this event.
            If it is false then do not run any rerenders.
            Otherwise rerender the whole app.
        */
                if (result === false) {
                    return;
                }
                change();

            });

            return 0;
        }

        if (name.charAt(name.length - 1) === "-") {
            
/* Render initial attribute. */
            const newValue = resolveData(data, value);

            elementProperties.includes(name.substring(0, name.length - 1))
                ? (element[name.substring(0, name.length - 1)] = newValue)
                : element.setAttribute(name.substring(0, name.length - 1), newValue);

            return new Attribute(name.substring(0, name.length - 1), value, true);
        }

        if (name.substr(0, 5) === "dill-") {
            return 0;
        }

/* Render initial attribute. */
        const newValue = deBracer(value, data);
        elementProperties.includes(name)
            ? (element[name] = newValue)
            : element.setAttribute(name, newValue);

        return new Attribute(name, value);
    });
}
