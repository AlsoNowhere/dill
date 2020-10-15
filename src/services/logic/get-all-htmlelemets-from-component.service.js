
export const getAllHtmlElementTemplatesFromComponent = (component, arr = []) => {
    let i = 0;
    const length = component.childTemplates.length;
    while (i < length) {
        const childTemplate = component.childTemplates[i];
        if (childTemplate.htmlElement) {
            arr.push(childTemplate);
        }
        else {
            getAllHtmlElementTemplatesFromComponent(childTemplate, arr);
        }
        i++;
    }
    return arr;
}
