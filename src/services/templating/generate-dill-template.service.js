
import { forEach } from "sage-library";

import { templateTextNode } from "./template-textnode.service";
import { templateComponent } from "./template-component.service";
import { templateHtmlElement } from "./template-html-element.service";

import { site } from "../../data/site.data";

/*
    Dill works in two parts.
     - Create templates that represent HTML and data.
     - Render templates.

    The following function generates Templates.
    A Dill Template not only contains information about what is on the page and the data that reflections what to show on the page.
    The templating process is also the way we add the Elements to the page.
    A render only updates the Elements already on the page.
*/
export const generateDillTemplate = (
    parentTemplate,
    rootElement,
    parentData,
    dillElements,
    isSvgOrChildOfSVG = false
) => {

/*
    We only allows Arrays. This makes this easier to predict in the code.
    We force the value to be an Array below.
*/
    if (!(dillElements instanceof Array)) {
        dillElements = [dillElements];
    }

/*
    There are three types of template we can create, each one is handled below.
     - Textnode. A simple HTML Element that is used to put text inside other HTML Elements.
     - A Dill Component. This contains child templates but does not render anything itself.
     - A single HTML Element. Can have child templates.
*/
    return forEach(dillElements, dillElement => {
        if (typeof dillElement === "string") {
            return templateTextNode(rootElement,
                parentData,
                dillElement
            );
        }
        else if (!!dillElement.Component) {
            return templateComponent(parentTemplate,
                rootElement,
                parentData,
                dillElement,
                isSvgOrChildOfSVG,
                // (a,b,c,d,e) => generateDillTemplate(a,b,c,d,e)
            );
        }
        else if (!!dillElement.nodeName) {
            return templateHtmlElement(parentTemplate,
                rootElement,
                parentData,
                dillElement,
                isSvgOrChildOfSVG,
                // (a,b,c,d,e) => generateDillTemplate(a,b,c,d,e)
            );
        }
    });
}

site.generateDillTemplate = generateDillTemplate;
