
export const DillIf = function(
    parentTemplate,
    rootElement,
    element,
    value,
    currentValue,
    dillElement,
    isSvgOrChildOfSVG,
    invertedCondition
){
    this.parentTemplate = parentTemplate;
    this.rootElement = rootElement;
    this.element = element;
    this.value = value;
    this.currentValue = currentValue;
    this.templated = currentValue;
    this.dillElement = dillElement;
    this.isSvgOrChildOfSVG = isSvgOrChildOfSVG;
    this.invertedCondition = invertedCondition;
}
