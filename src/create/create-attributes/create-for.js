
export var createFor = function(template){
    var element = template.element;
    var value;

    if (!element.attributes["dill-for"]) {
        return;
    }
    value = element.attributes["dill-for"].nodeValue;
    element.removeAttribute("dill-for");
    template.for = {
        initialCount: 0,
        clone: element.cloneNode(true),
        value: value,
        parent: element.parentElement,
        templates: []
    }
    element.parentElement.removeChild(element);
}
