
import { define, forEach } from "sage-library";

import { addProperty } from "../../logic/add-property.logic";

import { dillDataPropertyDefinitions } from "../../data/dill-data-property-definitions.data";

/*
    This function maps properties to a Component's data.
    This way we can pass properties to a Component from the parent Component.
*/
export const componentAttributes = (attributes, componentData, parentData) => {
    forEach(Object.entries(attributes), ([name, value]) => {

        if (name.substr(0, 5) === "dill-") {
            return;
        }

// <
// If attribute value starts and ends with ' then do not look this value up from the data but set it literally.
        if (value.charAt(0) === "'" && value.charAt(value.length - 1) === "'") {
            addProperty(componentData, name, value.substring(1, value.length - 1));
            return;
        }
// >



        define(
            componentData,
            name,
            () => parentData[value],
            _value => parentData[value] = _value,
            dillDataPropertyDefinitions
        );
    });
}
