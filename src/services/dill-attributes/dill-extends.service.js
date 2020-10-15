
import { resolveData } from "../../dill-core/services/resolve-data.service";

export const templateDillExtends = (attributes, data) => {
    if (!attributes["dill-extends"]) {
        return;
    }
    const value = attributes["dill-extends"];
    delete attributes["dill-extends"];
    const properties = resolveData(data, value);
    Object.assign(attributes, properties);
}
