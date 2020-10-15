
export const DillFor = function(
    parentTemplate,
    rootElement,
    element,
    value,
    currentLength,
    dillElement,
    isSvgOrChildOfSVG
){
    this.parentTemplate = parentTemplate;
    this.rootElement = rootElement;
    this.element = element;
    this.value = value;
    this.currentLength = currentLength;
    this.dillElement = dillElement;
    this.isSvgOrChildOfSVG = isSvgOrChildOfSVG;
    this.templates = [];
}
