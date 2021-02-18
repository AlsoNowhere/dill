
import { deBracer } from "../../logic/de-bracer.logic";

import { Template } from "../../models/Template.model";

export const templateTextNode = (
    rootElement,
    parentData,
    dillElement
) => {
    const textValue = dillElement;

    const textNode = document.createTextNode(
        deBracer(dillElement, parentData)
    );

    rootElement.appendChild(textNode);

    return new Template(
        rootElement,
        textNode,
        parentData,
        textValue
    );
}
