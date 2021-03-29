
import { forEach, reverseForEach } from "sage-library";

import { resolveData } from "../../logic/resolve-data.logic";
import { getAllHtmlTemplatesFromChildTemplates } from "../../logic/get-all-html-templates-from-child-templates.logic";
import { fireEvents } from "../../logic/fire-events.logic";

import { DillTemplate } from "../../models/DillTemplate.model";
import { SaveChildTemplates } from "../../models/SaveChildTemplates.model";

import { site } from "../../data/site.data";

export const templateDillTemplate = (
    data,
    attributes
) => {

    const { "dill-template": lookup } = attributes;

    if (!lookup) {
        return;
    }

    const referenceData = resolveData(data, lookup);

    return new DillTemplate(
        lookup,
        referenceData,
    );
}

export const renderDillTemplate = (
    template,
    htmlElement,
    data,
    dillTemplate,
    isSvgOrChildOfSVG
) => {

    if (!dillTemplate || !(dillTemplate instanceof DillTemplate)) {
        return;
    }

    const referenceData = resolveData(data, dillTemplate.lookup);
    let childTemplates;
    const savedTemplate = dillTemplate.savedComponents.find(x => x.referenceData === referenceData);

    reverseForEach(htmlElement.childNodes, x => x.parentNode.removeChild(x));

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
