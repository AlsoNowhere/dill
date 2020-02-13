
import { forReverseEach } from "../../common/for-each";
import { isSurroundedBy } from "../is-surrounded-by";
import { change } from "../../change/change";
import { resolveData } from "../../common/resolve-data";

export var attributeSpecialCharacter = ":";

export var createAttributes = function(template){
    var element = template.element;
    var data = template.data;
    var extendsValue;
    var key;
    var property;

    if (element.attributes["dill-extends"]) {
        extendsValue = resolveData(template.data,element.attributes["dill-extends"].nodeValue);
        for (key in extendsValue) {
            property = key;
            if (isSurroundedBy(key,"[","]")) {
                property = attributeSpecialCharacter + key.substring(1,key.length-1);
            }
            if (isSurroundedBy(key,"(",")")) {
                property = key.substring(1,key.length-1) + attributeSpecialCharacter;
            }
            element.setAttribute(property,extendsValue[key]);
        }
        element.removeAttribute("dill-extends");
    }

    template.attributes = forReverseEach(element.attributes,function(attribute){
        var name = attribute.nodeName;
        var attrName;
        if (name.substr(0,1) === "#") {
            template.data[name.substring(1,name.length)] = element;
            element.removeAttribute(name);
            return 0;
        }
        else if (isSurroundedBy(name,"[","]") || name.substr(0,1) === attributeSpecialCharacter) {
            name = attributeSpecialCharacter + name.substring(
                1,
                isSurroundedBy(name,"[","]")
                    ? attribute.name.length-1
                    : attribute.name.length
            );
            element.removeAttribute(attribute.nodeName);
        }
        else if (isSurroundedBy(name,"(",")") || name.substr(name.length-1,1) === attributeSpecialCharacter) {
            attrName = name.substring(
                isSurroundedBy(name,"(",")")
                    ? 1
                    : 0,
                attribute.name.length-1
            );
            element.addEventListener(
                attrName,
                function(event){
                    var checkForFalse = data[attribute.nodeValue].apply(data,[event,element]);
                    if (checkForFalse !== false) {
                        change();
                    }
                }
            );
            element.removeAttribute(name);
            return 0;
        }
        return {
            name: name,
            value: attribute.nodeValue
        };
    });
}
