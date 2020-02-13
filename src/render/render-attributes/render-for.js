
import { forEach } from "../../common/for-each";
import { resolveData } from "../../common/resolve-data";
import { render } from "../render";
import { createData } from "../../common/create-data";
import { Template } from "../../create/Template.model";

var DillFor = function(_item,_index){
    this._item = _item;
    this._index = _index;
};

export var renderFor = function(template,index){
    var initialCount;
    var parent;
    var list;
    var clone;
    var i = 0;
    var newClone;
    if (!template.for) {
        return;
    }
    initialCount = template.for.initialCount;
    parent = template.for.parent;
    list = resolveData(template.data,template.for.value);
    clone = template.for.clone;

    if (initialCount > list.length) {
        for (; i < initialCount - list.length ; i++) {
            parent.removeChild(parent.childNodes[index]);
            template.for.templates.shift();
        }
    }
    else if (initialCount < list.length) {
        for (; i < list.length - initialCount ; i++) {
            newClone = clone.cloneNode(true);
            parent.insertBefore(newClone,parent.childNodes[index+initialCount+i]);
            template.for.templates.push(
                new Template(template._module,
                    createData(new DillFor(list[initialCount+i],initialCount+i),template.data),
                    newClone,
                    template
                )
            );
        }
    }
    template.for.initialCount = list.length;
    forEach(list,function(listItem,i){
        var key;
        var relevantTemplate = template.for.templates[i];
        var data = relevantTemplate.data;
        if (listItem instanceof Object) {
            for (key in data) {
                if (!listItem.hasOwnProperty(key)) {
                    delete data[key];
                }
            }
            for (key in listItem) {
                data[key] = listItem[key];
            }
        }
        data._item = listItem;
        data._index = i;
        data._parent = template.data;
        render(relevantTemplate);
    });

    return list.length;
}
