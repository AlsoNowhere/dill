
import { createData } from "../common/create-data";
import { forReverseEach } from "../common/for-each";
import { isSurroundedBy } from "./is-surrounded-by";

export var createComponent = function(template){
    var element = template.element;
    var name = template.name.toLowerCase();
    var data = template.data;
    var parentData = template.data;
    if (!template._module.components[name]) {
        return false;
    }

    template.data = createData(
        new template._module.components[name].Component(),
        element.attributes["dill-isolate"] ? undefined : parentData
    );
    template.data._template = element.innerHTML;
    element.innerHTML = template._module.components[name].template;
    if (element.attributes["dill-isolate"]) {
        element.removeAttribute("dill-isolate");
    }
    if (template._module.components[name].module !== data._module) {
        template.data._module = template._module.components[name].module;
    }

    template.data._dillTemplate = template;

    template.data.onprerender && template.data.onprerender.apply(template.data);
    
    forReverseEach(element.attributes,function(attribute){
        var name = attribute.nodeName;
        if (name.substr(0,1) === "#") {
            template.data[name.substring(1,name.length)] = element;
        }
        else if (isSurroundedBy(attribute.nodeValue,"'")) {
            template.data[name] = attribute.nodeValue.substring(1,attribute.nodeValue.length-1);
        }
        else {
            Object.defineProperty(template.data,name,{
                get: function(){
                    return parentData[attribute.nodeValue];
                },
                set: function(value){
                    parentData[attribute.nodeValue] = value;
                }
            });
        }
        element.removeAttribute(name);
    });

    return true;
}
