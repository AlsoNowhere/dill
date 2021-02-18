
import { SaveChildTemplates } from "./SaveChildTemplates.model";

export const DillTemplate = function(
    lookup,
    referenceData
){
    this.lookup = lookup;
    this.savedComponents = [
        new SaveChildTemplates(referenceData)
    ];
}
