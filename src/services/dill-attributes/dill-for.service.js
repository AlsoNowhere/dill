
import { forEach } from "sage-library";

import { createData } from "../../dill-core/services/create-data.service";
import { resolveData } from "../../dill-core/services/resolve-data.service";

import { cleanData } from "../dill-engine/clean-data.service";
import { insertAfter } from "../logic/insert-after.service";
import { getPreviousHtmlTemplate } from "../logic/get-previous-html-template.service";
import { getHtmlAndComponentChildTemplates } from "../logic/get-html-and-component-child-templates.service";
import { getAllHtmlElementTemplatesFromComponent } from "../logic/get-all-htmlelemets-from-component.service";

import { DillFor } from "../../models/DillFor.model";

export const templateDillFor = (parentTemplate, rootElement, element, attributes, data, dillElement, isSvgOrChildOfSVG) => {
    if (!attributes["dill-for"]) {
        return;
    }

    const value = attributes["dill-for"];

/* Delete the property here so that we don't create two templates for DillIf. */
    delete attributes["dill-for"];

    return new DillFor(
        parentTemplate,
        rootElement,
        element,
        value,
        0,
        dillElement,
        isSvgOrChildOfSVG
    );
}

export const renderDillFor = (change, generateDillTemplate, render, dillFor, template, data) => {

    const newValue = resolveData(data, dillFor.value);
    const oldLength = dillFor.currentLength;
    const newLength = newValue instanceof Array ? newValue.length : 0;

    let newList = dillFor.templates;

    if (oldLength < newLength) {

/*
    This intermediate Element is used to provide a root Element that the generate Template is looking for.
    It is not used usewhere, we just need it to be able to generated a Template.
*/
        const intermediary  = document.createElement("DIV");

        dillFor.templates.push(
            ...newValue.slice(oldLength - newLength)
            .map((x, i) => {
                const newData = cleanData(createData({}, data), x, oldLength + i, data);

        /* Clone Template for each new For item. */
                const newDillElement = {...dillFor.dillElement};
                newDillElement.attributes = {...newDillElement.attributes};
                delete newDillElement.attributes["dill-for"];

        /*
            Generate a new Template for the cloned Template.
            This Template generation will always return an Array with one item, we destructure the Array here to get that one value.
        */
                const [newTemplate] = generateDillTemplate(
                    template,
                    intermediary,
                    newData,
                    newDillElement,
                    dillFor.isSvgOrChildOfSVG,
                    change
                );

        /*
            The new Templates all have the intermediary value as their rootElement.
            In order to change this we to get all the templates that have this as the rootElement, inside Components.
        */
                forEach(getHtmlAndComponentChildTemplates([newTemplate]), x => x.rootElement = template.rootElement);

                return newTemplate;
            })
        );

/*
    Add the new HTML Elements to the parent Element.
    This includes all Elements that are children of any Components.
*/
        const previousHtmlTemplate = oldLength === 0
            ? getPreviousHtmlTemplate(dillFor, template)
            : dillFor.templates[oldLength - 1];

        let previousElement = previousHtmlTemplate && (
            previousHtmlTemplate.Component
                ? getAllHtmlElementTemplatesFromComponent(previousHtmlTemplate)
                : [previousHtmlTemplate]
            )
            .pop().htmlElement;

        forEach([...intermediary.children], element => {
            insertAfter(template.rootElement, previousElement, element);
            previousElement = element;
        });

        newList = dillFor.templates.slice(0, oldLength);
    }

    else if (oldLength > newLength) {

/* Remove all HTML Elements from the parent Element that drop off the list at the end. */
        forEach(dillFor.templates.slice(newLength), each => {
            const htmlTemplates = each.Component
                ? getAllHtmlElementTemplatesFromComponent(each)
                : [each];

            forEach(htmlTemplates, each => {
                each.htmlElement.parentNode.removeChild(each.htmlElement);
            });
        });

        dillFor.templates = dillFor.templates.slice(0, newLength);

        newList = dillFor.templates;
    }

    forEach(newList, (x, i) => {
        cleanData(x.data, newValue[i], i, data)
    });
    forEach(dillFor.templates, render);

    dillFor.currentLength = newLength;
}
