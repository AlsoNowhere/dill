import { forEach } from "sage-library"

export const getHtmlAndComponentChildTemplates = (templates, arr = []) => {
    forEach(templates, template => {
        arr.push(template);
        if (template.Component) {
            getHtmlAndComponentChildTemplates(template.childTemplates, arr);
        }
    });
    return arr;
}
