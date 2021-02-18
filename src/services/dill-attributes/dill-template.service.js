
import { forEach } from "sage-library";

import { resolveData } from "../../logic/resolve-data.logic";

import { DillTemplate } from "../../models/DillTemplate.model";
import { SaveChildTemplates } from "../../models/SaveChildTemplates.model";
import { DillElement } from "../../models/DillElement.model";

import { site } from "../../data/site.data";
import { getAllHtmlTemplatesFromChildTemplates } from "../../logic/get-all-html-templates-from-child-templates.logic";
import { fireEvents } from "../../logic/fire-events.logic";

/*
    This function replaces the childTemplates of a given Template with a value from the data.
    This is powerful way to programmtically set the content inside an Element.
*/
export const templateDillTemplate = (
    data,
    attributes
) => {

    if (!attributes["dill-template"]) {
        return;
    }

    const lookup = attributes["dill-template"];
    const referenceData = resolveData(data, lookup);

    return new DillTemplate(
        lookup,
        referenceData,
    );
}

export const renderDillTemplate = template => {

    const { htmlElement, data, dillTemplate, isSvgOrChildOfSVG } = template;

    if (!dillTemplate) {
        return;
    }

    const referenceData = resolveData(data, dillTemplate.lookup);
    let childTemplates;
    const savedTemplate = dillTemplate.savedComponents.find(x => x.referenceData === referenceData);

    forEach(htmlElement.childNodes, x => x.parentNode.removeChild(x));

    if (!savedTemplate || savedTemplate.childTemplates === null) {

        childTemplates = site.generateDillTemplate(
            template,
            htmlElement,
            data,
            referenceData,
            isSvgOrChildOfSVG
        );

        if (!savedTemplate) {
            dillTemplate.savedComponents.push(
                new SaveChildTemplates(referenceData, childTemplates)
            );
        }
        else {
            savedTemplate.childTemplates = childTemplates;
        }

        template.childTemplates.length = 0;
        template.childTemplates.push(...childTemplates);
    }
    else {
        template.childTemplates.length = 0;
        template.childTemplates.push(...savedTemplate.childTemplates);
        const htmlElements = getAllHtmlTemplatesFromChildTemplates(savedTemplate.childTemplates);
        forEach(htmlElements, x => htmlElement.appendChild(x.htmlElement));
        fireEvents(template, "oninserted");
    }
}
