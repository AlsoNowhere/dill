import { resolveData } from "../../common/resolve-data";
import { Template } from "../../create/Template.model";

export var renderDillTemplate = function(template){
    var element;
    var value;
    var newTemplate;
    if (!template.dillTemplate) {
        return;
    }
    value = resolveData(template.data,template.dillTemplate.property);
    if (value === template.dillTemplate.initialValue) {
        return;
    }
    element = template.element;
    template.dillTemplate.initialValue = value;
    element.innerHTML = value;
    newTemplate = new Template(template._module,template.data,element,template);
    template.childTemplates = newTemplate.childTemplates;
}
