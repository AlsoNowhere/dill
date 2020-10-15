
import { reverseForEach } from "sage-library";

import { resolveData } from "../../dill-core/services/resolve-data.service";

import { DillTemplate } from "../../models/DillTemplate.model";


/*
    This function replaces the childTemplates of a given Template with a value from the data.
    This is powerful way to programmtically set the content inside an Element.
*/
export const templateDillTemplate = (data, attributes, dillElement) => {

    if (!attributes["dill-template"]) {
        return;
    }

    const templateValue = attributes["dill-template"];
    const childTemplates = resolveData(data, templateValue);

    if (!(childTemplates instanceof Array)) {
        return;
    }

    dillElement.childTemplates.length = 0;
    dillElement.childTemplates.push(...childTemplates);

    return new DillTemplate(
        templateValue,
        childTemplates
    );
}

export const renderDillTemplate = (change, generateDillTemplate, template) => {
    if (!template.dillTemplate) {
        return;
    }
    const {oldValues} = template.dillTemplate;
    const newValues = resolveData(template.data, template.dillTemplate.lookup);
    if (oldValues !== newValues) {
        reverseForEach(template.htmlElement.children, x => x.parentNode.removeChild(x));
        const childTemplates = generateDillTemplate(
            template,
            template.htmlElement,
            template.data,
            newValues,
            template.isSvgOrChildOfSVG,
            change
        );
        template.childTemplates.length = 0;
        template.childTemplates.push(...childTemplates);
        template.dillTemplate.oldValues = newValues;
    }
}
