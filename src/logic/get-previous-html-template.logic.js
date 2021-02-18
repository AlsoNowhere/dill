
import { getAllHtmlElementTemplatesFromComponent } from "./get-all-htmlelemets-from-component.logic";

export const getPreviousHtmlTemplate = (dillModel, template) => {

    const templatesOnPage = dillModel.parentTemplate.childTemplates.filter(x => x === template || !x.dillIf || x.dillIf.currentValue);
    const templateIndex = templatesOnPage.indexOf(template);
    let previousHtmlTemplate = templatesOnPage[templateIndex - 1];
    if (!previousHtmlTemplate || !previousHtmlTemplate.Component) {
        return previousHtmlTemplate;
    }

    return getAllHtmlElementTemplatesFromComponent(previousHtmlTemplate).pop();
}
