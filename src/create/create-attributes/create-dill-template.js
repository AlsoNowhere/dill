import { resolveData } from "../../common/resolve-data";

export var createDillTemplate = function(template){
    var element = template.element;
    var attribute;
    var value;
    if (!element.attributes["dill-template"]) {
        return;
    }
    attribute = element.attributes["dill-template"];
    value = resolveData(template.data,attribute.nodeValue);
    template.dillTemplate = {
        property: attribute.nodeValue,
        initialValue: value
    };
    element.removeAttribute("dill-template");
    element.innerHTML = value;
}
