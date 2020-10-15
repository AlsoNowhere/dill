
import { Template } from "../../models/Template.model";

import { templateAttributes } from "../attributes/template-attributes.service";
import { templateDillExtends } from "../dill-attributes/dill-extends.service";
import { templateDillIf } from "../dill-attributes/dill-if.service";
import { templateDillFor } from "../dill-attributes/dill-for.service";
import { templateDillTemplate } from "../dill-attributes/dill-template.service";

export const templateHtmlElement = (
    change,
    generateDillTemplate,
    parentTemplate,
    rootElement,
    parentData,
    dillElement,
    isSvgOrChildOfSVG
) => {

/*
    SVG Elements are not HTML and therefore we need to know when we are inside SVG so that we can produce SVG Elements.
    The rule is simple, if we enter an <svg> tag that and every child of that will be an SVG Element.
*/
    if (dillElement.nodeName === "svg") {
        isSvgOrChildOfSVG = true;
    }

/* Create the HTML Element for this Template. */
    const htmlElement = isSvgOrChildOfSVG
        ? document.createElementNS("http://www.w3.org/2000/svg", dillElement.nodeName)
        : document.createElement(dillElement.nodeName);

/* Clone the Template attributes. */
    const attributes = {...(dillElement.attributes || {})};

/* Dill tool to add many attribtues to an element or Component. dill-extends */
    templateDillExtends(attributes, parentData);

/* Handle dill-if and dill-for attributes. */
/* DillIf is a conditional flag for whether we should add this element or not. */
    const dillIf = templateDillIf(parentTemplate, rootElement, htmlElement, attributes, parentData, dillElement, isSvgOrChildOfSVG);
/* DillFor is a repeat flag that will loop over an Array and clone the target. */
    const dillFor = templateDillFor(parentTemplate, rootElement, htmlElement, attributes, parentData, dillElement, isSvgOrChildOfSVG);

/* DillIf and DillFor are structural changes and affect what will be rendered. This variable captures what should happen next. */
    const elementWillBeRendered = !dillFor && (!dillIf || dillIf.currentValue);

/*
    This function takes the list of attributes on the Template and checks them, removing any attribute which is not valid and has another purpose.
    We then save the attributes that will be checked on each rerender.
*/
    const attributesForTemplate = elementWillBeRendered
        ? templateAttributes(change, htmlElement, attributes, parentData)
        : [];

/* Add this HTML to the document. */
    elementWillBeRendered && rootElement.appendChild(htmlElement);

/* Handle the attribute dill-template. */
    const dillTemplate = elementWillBeRendered && templateDillTemplate(parentData, attributes, dillElement);

/* We create a new template. */
    const newTemplate = new Template(
        rootElement,
        htmlElement,
        parentData,
        attributesForTemplate,
        {
            dillIf,
            dillFor,
            dillTemplate
        }
    );

/* Recursively continue to check child templates. */
    newTemplate.childTemplates = elementWillBeRendered
        ? generateDillTemplate(
            newTemplate,
            htmlElement,
            parentData,
            dillElement.childTemplates,
            isSvgOrChildOfSVG,
            change
        )
        : [];

    return newTemplate;
}
