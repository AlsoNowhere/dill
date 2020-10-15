
import { deBracer } from "../../dill-core/services/de-bracer.service";

export const renderTextNode = (element, value, data) => {

    const oldValue = element.nodeValue;
    const newValue = deBracer(value, data);

    if (oldValue !== newValue) {
        element.nodeValue = newValue;
    }
}
