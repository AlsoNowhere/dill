import { resolveData } from "../../common/resolve-data";

export var createIf = function(template){
    var element = template.element;
    var value;
    var inverse = false;
    var initialValue;
    if (!element.attributes["dill-if"]) {
        return true;
    }
    value = element.attributes["dill-if"].nodeValue;
    if (value.substr(0,1) === "!") {
        value = value.substring(1,value.length);
        inverse = true;
    }
    element.removeAttribute("dill-if");
    initialValue = resolveData(template.data,value);
    if (inverse) {
        initialValue = !initialValue;
    }
    template.if = {
        initialValue: initialValue,
        templated: initialValue,
        value: value,
        inverse: inverse,
        parent: element.parentElement
    };

    if (!initialValue) {
        element.parentElement.removeChild(element);
    }
    
    return initialValue;
}
