
import { forEach } from "sage-library";

import { resolveData } from "../../dill-core/services/resolve-data.service";

import { getPreviousHtmlTemplate } from "../logic/get-previous-html-template.service";
import { getAllHtmlTemplatesFromChildTemplates } from "../logic/get-all-html-templates-from-child-templates.service";
import { getHtmlAndComponentChildTemplates } from "../logic/get-html-and-component-child-templates.service";
import { insertAfter } from "../logic/insert-after.service";
import { fireEvents } from "../logic/fire-events.service";
import { componentAttributes } from "../attributes/component-attributes.service";
import { templateDillExtends } from "./dill-extends.service";
import { templateAttributes } from "../attributes/template-attributes.service";

import { DillIf } from "../../models/DillIf.model";

export const templateDillIf = (parentTemplate, rootElement, element, attributes, data, dillElement, isSvgOrChildOfSVG) => {
    if (!attributes["dill-if"]) {
        return;
    }

    const invertedCondition = attributes["dill-if"].charAt(0) === "!";
    const value = attributes["dill-if"].substr(invertedCondition ? 1 : 0);
    const currentValue = resolveData(data, value);

/* Delete the property here so that we don't create two templates for DillIf. */
    delete attributes["dill-if"];

    return new DillIf(
        parentTemplate,
        rootElement,
        element,
        value,
        invertedCondition ? !currentValue : currentValue,
        dillElement,
        isSvgOrChildOfSVG,
        invertedCondition
    );
}

export const renderDillIf = (change, generateDillTemplate, dillIf, template, data) => {
    if (!dillIf) {
        return;
    }

    const oldValue = dillIf.currentValue;
    const firstValue = resolveData(data, dillIf.value);
    const newValue = dillIf.invertedCondition ? !firstValue : firstValue;
    const changedToTrue = oldValue === false && newValue === true;
    const changedToFalse = oldValue === true && newValue === false;
    const isComponent = !!template.Component;
    
    if (changedToTrue) {

/* If this Template has never been added to the document then we need to generate a Template for it here. */
        if (!dillIf.templated) {

    /* An intermediate Element is needed as the rootElement to generate a new Template. */
            const intermediary  = document.createElement("DIV");

            const childTemplates = generateDillTemplate(
                template,
                isComponent ? intermediary : template.htmlElement,
                data,
                isComponent ? dillIf.dillElement.Component.component.elements : dillIf.dillElement.childTemplates,
                dillIf.isSvgOrChildOfSVG,
                change
            );

        /* Build Component inherited properties. */
            const attributes = {...(dillIf.dillElement.attributes || {})};
            templateDillExtends(attributes, data);
            if (isComponent) {
                componentAttributes(attributes, data, data._parent);
            }
            else {
                template.attributes.push(
                    ...templateAttributes(change, template.htmlElement, attributes, data)
                );
            }

        /* We need to make sure that these new childTemplates have the correct rootElement, not the intermediate Element. */
            isComponent && forEach(getHtmlAndComponentChildTemplates(childTemplates), x => x.rootElement = template.rootElement);

            template.childTemplates = childTemplates;

            isComponent && fireEvents(template, "oninit");

            dillIf.templated = true;
        }

/* Lifecycle hook. */
        isComponent && fireEvents(template, "oninserted");

/* Add the new Elements to the document. */
        let previousHtmlTemplate = getPreviousHtmlTemplate(dillIf, template);
        const allHtmlTemplates = isComponent
            ? getAllHtmlTemplatesFromChildTemplates(template.childTemplates)
            : [template];

        forEach(allHtmlTemplates, elementTemplate => {
            insertAfter(template.rootElement, previousHtmlTemplate && previousHtmlTemplate.htmlElement, elementTemplate.htmlElement);
            previousHtmlTemplate = elementTemplate;
        });

        dillIf.currentValue = true;
    }

    if (changedToFalse) {
        const allHtmlTemplates = isComponent
            ? getAllHtmlTemplatesFromChildTemplates(template.childTemplates)
            : [template];

        forEach(allHtmlTemplates, element => {
            element.htmlElement.parentNode.removeChild(element.htmlElement);
        });

        dillIf.currentValue = false;
    }

    return dillIf;
}
