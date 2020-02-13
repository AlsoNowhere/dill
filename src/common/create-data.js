import { defineProperty } from "./define-property";

export var createData = function(newData,parentData){
    var Data = function(){
        var key;
        for (key in newData) {
            defineProperty(this,key,newData[key]);
        }
        if (parentData !== undefined) {
            this._parent = parentData;
        }
    }
    Data.prototype = parentData === undefined
        ? {}
        : parentData;
    return new Data();
}
