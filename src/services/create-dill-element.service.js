
import { DillElement } from "../models/DillElement.model";

export const createDillElement = function(
    element,
    attributes,
    childTemplate
){
    return new DillElement(
        element,
        attributes,
        childTemplate instanceof Array ? childTemplate : [...arguments].slice(2)
    );
}
