import { resolveData } from "../../common/resolve-data";
import { render } from "../render";
import { forEach } from "../../common/for-each";
import { Template } from "../../create/Template.model";

var fireOnInsertedEvents = function(template){
    if (template.component && template.data.hasOwnProperty("oninserted")) {
        template.data.oninserted();
    }
    template.childTemplates && forEach(template.childTemplates,function(x){
        if (x.if && !x.if.initialValue) {
            return;
        }
        fireOnInsertedEvents(x);
    });
}

export var renderIf = function(template,index){
    var element = template.element;
    var data = template.data;
    var newValue = resolveData(data,template.if.value);
    var newTemplate;
    if (template.if.inverse) {
        newValue = !newValue;
    }
    if (newValue && template.if.initialValue) {
        return;
    }
    else if (newValue && !template.if.initialValue) {
        if (template.if.parent.childNodes.length === 0 || template.if.parent.childNodes.length === index) {
            template.if.parent.appendChild(element);
        }
        else {
            template.if.parent.insertBefore(element,template.if.parent.childNodes[index]);
        }
        if (!template.if.templated) {
            newTemplate = new Template(template._module,template.data,element);
            template.childTemplates = newTemplate.childTemplates;
            template.attributes = newTemplate.attributes;
            template.if.templated = true;
        }
        fireOnInsertedEvents(template);
        template.if.initialValue = true;
        render(template,index);
        return 2;
    }
    else if (!newValue && template.if.initialValue) {
        template.if.parent.removeChild(element);
        template.if.initialValue = false;
        return 0;
    }
    return 1;
}
