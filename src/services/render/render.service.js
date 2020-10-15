
import { forEach } from "sage-library";

import { renderAttributes } from "../attributes/render-attributes.service";
import { renderTextNode } from "./render-textnode.service";
import { renderDillIf } from "../dill-attributes/dill-if.service";
import { renderDillFor } from "../dill-attributes/dill-for.service";
import { generateDillTemplate } from "../generate-dill-template.service";
import { setUpChange } from "../change.service";
import { renderDillTemplate } from "../dill-attributes/dill-template.service";

/*
    This function takes a Template instance and updates the connected element using the latest values.
    - We can ignore Components.
    - Only text nodes have content which we can update, they do not have attributes.
    - We only need to update the attributes of a HTML Element.
    - We don't need to change event listeners as this is handled in the Template stage.
*/
export const render = template => {

    const change = setUpChange(render);

    if (template instanceof Array) {
        forEach(template, render);
        return;
    }

    const { htmlElement, textNode, textValue, attributes, data, dillIf, dillFor } = template;

    if (!!textNode) {
        return renderTextNode(textNode, textValue, data);
    }

    const newDillIf = renderDillIf(change, generateDillTemplate, dillIf, template, data);

    if (newDillIf && !newDillIf.currentValue) {
        return;
    }

    if (!!dillFor) {
        renderDillFor(change, generateDillTemplate, render, dillFor, template, data);
        return;
    }

    !!htmlElement && renderAttributes(htmlElement, attributes, data);

    !!htmlElement && renderDillTemplate(change, generateDillTemplate, template);

    template.childTemplates instanceof Array && forEach(template.childTemplates, render);
}
