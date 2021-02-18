
import { componentAttributes } from "../attributes/component-attributes.service";
import { templateDillExtends } from "../dill-attributes/dill-extends.service";
import { templateDillIf } from "../dill-attributes/dill-if.service";
import { templateDillFor } from "../dill-attributes/dill-for.service";

import { addProperty } from "../../logic/add-property.logic";
import { createData } from "../../logic/create-data.logic";

import { Template } from "../../models/Template.model";

import { site } from "../../data/site.data";

export const templateComponent = (
    parentTemplate,
    rootElement,
    parentData,
    dillElement,
    isSvgOrChildOfSVG
) => {
    // console.log("Debugging: ", dillElement.Component.name);
    // debugger;


// <
//  Create a new Data object from this Component and add it to the data tree.
    const componentData = createData(new dillElement.Component(), parentData);
// >



// <
//  Add a property this this new data that contains all the dillElements that were inside this instance of the Component.
//  This will allow them to be added in somewhere in the content if we want.
    addProperty(
        componentData,
        "_template",
        dillElement.childTemplates
    );
// >



/* Get a clone of the Component attributes. */
    const attributes = {...(dillElement.attributes || {})};

/* Dill tool to add many attribtues to an element or Component. dill-extends */
    templateDillExtends(attributes, componentData);

    {
        const quickLookUp = [
            parentTemplate,
            rootElement,
            dillElement.Component,
            attributes,
            parentData,
            dillElement,
            isSvgOrChildOfSVG
        ];
    
/* Handle dill-if and dill-for attributes. */
/* DillIf is a conditional flag for whether we should add this element or not. */
        var dillIf = templateDillIf(...quickLookUp);
/* DillFor is a repeat flag that will loop over an Array and clone the target. */
        var dillFor = templateDillFor(...quickLookUp);
    }

/* DillIf and DillFor are structural changes and affect what will be rendered. This variable captures what should happen next. */
    const elementWillBeRendered = !dillFor && (!dillIf || dillIf.currentValue);
    // const elementWillBeRendered = true;

/*
    Component attributes represent a unique mapping to a given Component.
    This new data is written straight to this new instance of the given Component base.
*/
    elementWillBeRendered && componentAttributes(attributes, componentData, parentData);

/* We create a new template. */
    const newTemplate = new Template(
        rootElement,
        dillElement,
        componentData,
        null,
        {
            dillIf,
            dillFor
        }
    );

/*
    We add this property to the new data. This allows the context to be exposed to the app.
    We do this so that rerendering can be targetted and therefore made more efficient.
*/
    componentData._dillContext = newTemplate;

/* Lifecycle hooks. */
    elementWillBeRendered && componentData.hasOwnProperty("oninit") && componentData.oninit();
    elementWillBeRendered && componentData.hasOwnProperty("oninserted") && componentData.oninserted();

/* Recursively continue to check child templates. */
    newTemplate.childTemplates = elementWillBeRendered
        ? site.generateDillTemplate(
        // ? (circularDependencyCallBack && circularDependencyCallBack(
            newTemplate,
            rootElement,
            componentData,
            dillElement.Component.component.elements,
            isSvgOrChildOfSVG
        // ))
        )
        : [];

/* Lifecycle hook. */
    elementWillBeRendered && componentData.hasOwnProperty("onaftercontent") && componentData.onaftercontent();

    return newTemplate;
}
