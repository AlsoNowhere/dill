
import { addProperty } from "./add-property.logic";

export const cleanData = (targetObject, mapObject, index, parentData) => {

    if (!targetObject.hasOwnProperty("_item")) {
        addProperty(targetObject, "_item", mapObject);
    }
    else if (targetObject._item !== mapObject) {
        targetObject._item = mapObject;
    }



    if (!targetObject.hasOwnProperty("_index")) {
        addProperty(targetObject, "_index", index);
    }
    else if (targetObject._index !== index) {
        targetObject._index = index;
    }



    if (!targetObject.hasOwnProperty("_parent")) {
        addProperty(targetObject, "_parent", parentData);
    }



    if (!(mapObject instanceof Object)) {
        return targetObject;
    }



    // for (let key in targetObject) {
    //     if (key === "_item" || key === "_index" || key === "_parent") {
    //         continue;
    //     }
    //     if (Object.prototype.hasOwnProperty.call(targetObject, key)
    //         && mapObject[key] === undefined) {
    //         delete targetObject[key];
    //     }
    // }



    for (let key in mapObject) {
        delete targetObject[key];
        addProperty(targetObject, key, mapObject[key]);
    }

    return targetObject;
}
