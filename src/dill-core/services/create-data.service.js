
import { define } from "sage-library";

import { dillDataPropertyDefinitions } from "../../data/dill-data-property-definitions.data";

export const createData = (newData, parentData) => {
    const Data = function(){
        for (let key in newData) {
            let _value = newData[key];
            // Object.defineProperty(this, key, {
            //     get: () => _value,
            //     set: value => _value = value,
            //     enumerable: true,
            //     configurable: true
            // });
            define(this, key, () => _value, value => _value = value, dillDataPropertyDefinitions);
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
