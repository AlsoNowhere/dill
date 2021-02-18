
import { resolveData } from "../../logic/resolve-data.logic";

export const templateDillExtends = (attributes, data) => {
    if (!attributes["dill-extends"]) {
        return;
    }
    const value = attributes["dill-extends"];
    delete attributes["dill-extends"];
    const properties = resolveData(data, value);
    Object.assign(attributes, properties);
}
