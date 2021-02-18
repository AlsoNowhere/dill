
import { forEach } from "sage-library";

import { deBracer } from "../../logic/de-bracer.logic";
import { resolveData } from "../../logic/resolve-data.logic";

// import { change } from "../../services/rendering/change.service";

import { Attribute } from "../../models/Attribute.model";

import { elementProperties } from "../../data/element-properties.data";
import { site } from "../../data/site.data";

/*
    This function takes an object of attributes and acts in four ways.
     - If the attribute name ends in --- then add this element to the data.
     - If the attribute name ends in -- then add an event to the element.
     - If the attribute name ends in - then this attribute value will be set from a property on the data.
     - Any other valid property (doesn't start with 'dill-') then this is a normal attribute and will be rendered as such.
    Attributes are not added during the template stage but the render stage.
*/
export const templateAttributes = (
    element,
    attributes,
    data
) => {

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

            const eventName = name.substring(0, name.length - 2);

            element.addEventListener(eventName, event => {



// <
//  Get the result of the function that runs on this event.
                const result = data[value](event, element);
// >



// <
//   If this result is false then do not run any rerenders.
                if (result === false) {
                    return;
                }
// >



                site.runChangeOnEvents && site.change(data);

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
