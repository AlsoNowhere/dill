
import { forEach } from "sage-library";

import { resolveData } from "../../dill-core/services/resolve-data.service";

export const fireEvents = (template, eventName) => {
    if (template.dillIf && !resolveData(template.data, template.dillIf.value)) {
        return;
    }
    if (template.dillFor) {
        const newLength = resolveData(template.data, template.dillFor.value).length;
        forEach(template.dillFor.templates.slice(0, newLength), x =>  fireEvents(x, eventName));
        return;
    }
    if (template.Component && template.data.hasOwnProperty(eventName)) {
        template.data[eventName]();
    }
    forEach(template.childTemplates, x =>  fireEvents(x, eventName));
}
