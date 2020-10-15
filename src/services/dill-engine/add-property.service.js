
import { define } from "sage-library";

import { dillDataPropertyDefinitions } from "../../data/dill-data-property-definitions.data";

export const addProperty = (data, name, _value) => {
    define(data, name, () => _value, value => _value = value, dillDataPropertyDefinitions);
}
