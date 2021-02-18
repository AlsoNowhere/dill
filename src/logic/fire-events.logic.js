
import { forEach } from "sage-library";

// import { resolveData } from "./resolve-data.logic";

export const fireEvents = (template, eventName) => {

/* If template has a dillIf and its false then element won't be rendered so do not run event. */
    if (!!template.dillIf && !template.dillIf.currentValue) {
        return;
    }

/* Handle a list of elements here */
    if (template.dillFor) {
        // const newLength = resolveData(template.data, template.dillFor.value).length;
        // forEach(template.dillFor.templates.slice(0, newLength), x =>  fireEvents(x, eventName));
        forEach(template.dillFor.templates, x =>  fireEvents(x, eventName));
        return;
    }

/* Only run when at the root of the Component being checked, instead of running for every child element. */
    if (template.Component && template.data.hasOwnProperty(eventName)) {
        template.data[eventName]();
    }

/* Cycle through child templates too. */
    forEach(template.childTemplates, x =>  fireEvents(x, eventName));
}
