
import { resolveData } from "../../common/resolve-data";
import { forEach } from "../../common/for-each";
import { deBracer } from "../de-bracer";
import { attributeSpecialCharacter } from "../../create/create-attributes/create-attributes";

var elementProperties = ["value","checked"];

export var renderAttributes = function(template){
    var data = template.data;
    var element = template.element;

    if (!template.attributes) {
        return;
    }

    forEach(template.attributes,function(attribute){
        var name;
        var value;
        if (attribute.name.substr(0,1) === attributeSpecialCharacter) {
            name = attribute.name.replace(attributeSpecialCharacter,"");
            value = resolveData(data,attribute.value);
            if (elementProperties.indexOf(name) > -1) {
                element[name] = value;
            }
            else if (value === false || value === "") {
                element.removeAttribute(name);
            }
            else {
                element.setAttribute(name,value);
            }
        }
        else {
            element.setAttribute(attribute.name,deBracer(attribute.value,data));
        }
    });
}
