
import { getAllHtmlElementTemplatesFromComponent } from "./get-all-htmlelemets-from-component.logic";

export const getAllHtmlTemplatesFromChildTemplates = childTemplates => {
    return childTemplates
        .map(x => x.Component ? getAllHtmlElementTemplatesFromComponent(x) : x)
        .reduce((a, b) => (b instanceof Array ? a.push(...b) : a.push(b), a), []);
}
