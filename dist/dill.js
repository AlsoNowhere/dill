const define = (scope, property, getAction, setAction, objectDefinitions = {}) => {
    if (!(scope instanceof Object)) {
        throw new Error("Thyme, define, scope -- You must pass an Object as the scope");
    }
    if (typeof property !== "string") {
        throw new Error("Thyme, define, property -- You must pass a string as the property");
    }
    if (!(getAction instanceof Function)) {
        throw new Error("Thyme, define, getAction -- You must pass a function as the getAction");
    }
    if (!(setAction instanceof Function)) {
        throw new Error("Thyme, define, setAction -- You must pass a function as the setAction");
    }

    Object.defineProperty(scope, property, {
        get: getAction,
        set: setAction,
        ...objectDefinitions
    });
};

const baseForEach = (initialIncrement, howToEndWhile, increment) => {
    return (array, callback) => {

        let i = initialIncrement(array),
            result;

        const newArray = [];

        while (howToEndWhile(i, array)) {

            result = callback(array[i], i);

            if (result === false) {
                break;
            }

            if (typeof result === "number") {
                i += result;
            }
            else {
                newArray.push(result);
            }

            i += increment;
        }

        return newArray;
    }
};

const forEach = baseForEach(
    () => 0,
    (i, array) => i < array.length,
    1
);

const reverseForEach = baseForEach(
    array => array.length - 1,
    i => i >= 0,
    -1
);

var resolveData = (data, value) => {
    var output = data[value] instanceof Function
        && data[value].component === undefined
            ? data[value]()
            : data[value];
    return output === undefined
        ? ""
        : output;
};

var deBracer = (string, data) => string
    .replace(/{[A-Za-z0-9_$]+}/g, (match, index) => {
        if (string.charAt(index-1) === "\\") {
            return match;
        }
        return resolveData(data, match.substring(1, match.length-1));
    });

const Component = function(
    elements,
    isolated = false
){
    this.elements = elements;
    this.isolated = isolated;

    Object.freeze(this);
};

const Template = function(
    rootElement,
    element,
    data,
    attributesOrTextValue = null,
    dillAttributes = {}
){
    this.rootElement = rootElement;

    if (element instanceof Text) {
        this.textNode = element;
        this.textValue = attributesOrTextValue;
    }
    else if (element instanceof Element) {
        this.htmlElement = element;
        attributesOrTextValue !== null && (this.attributes = attributesOrTextValue);
    }
    else if (element.Component && element.Component.component instanceof Component) {
        this.Component = element;
        attributesOrTextValue !== null && (this.attributes = attributesOrTextValue);
    }

    this.data = data;
    this.childTemplates = [];

    dillAttributes.dillIf && (this.dillIf = dillAttributes.dillIf);
    dillAttributes.dillFor && (this.dillFor = dillAttributes.dillFor);
    dillAttributes.dillTemplate && (this.dillTemplate = dillAttributes.dillTemplate);

    Object.seal(this);
};

const templateTextNode = (
    rootElement,
    parentData,
    dillElement
) => {
    const textValue = dillElement;

    const textNode = document.createTextNode(
        deBracer(dillElement, parentData)
    );

    rootElement.appendChild(textNode);

    return new Template(
        rootElement,
        textNode,
        parentData,
        textValue
    );
};

const dillDataPropertyDefinitions = {
    // writable: true,
    enumerable: true,
    configurable: true
};

const addProperty = (data, name, _value) => {
    define(data, name, () => _value, value => _value = value, dillDataPropertyDefinitions);
};

/*
    This function maps properties to a Component's data.
    This way we can pass properties to a Component from the parent Component.
*/
const componentAttributes = (attributes, componentData, parentData) => {
    forEach(Object.entries(attributes), ([name, value]) => {

        if (name.substr(0, 5) === "dill-") {
            return;
        }

// <
// If attribute value starts and ends with ' then do not look this value up from the data but set it literally.
        if (value.charAt(0) === "'" && value.charAt(value.length - 1) === "'") {
            addProperty(componentData, name, value.substring(1, value.length - 1));
            return;
        }
// >



        define(
            componentData,
            name,
            () => parentData[value],
            _value => parentData[value] = _value,
            dillDataPropertyDefinitions
        );
    });
};

const templateDillExtends = (attributes, data) => {
    if (!attributes["dill-extends"]) {
        return;
    }
    const value = attributes["dill-extends"];
    delete attributes["dill-extends"];
    const properties = resolveData(data, value);
    Object.assign(attributes, properties);
};

const Attribute = function(
    name,
    value,
    dillAttribute = false
){
    this.name = name;
    this.value = value;
    this.dillAttribute = dillAttribute;

    Object.freeze(this);
};

const elementProperties = [
    "value",
    "checked"
];

const site = new function SiteData(){
    this.app = null;
    this.strictMode = false;
    this.devMode = false;
    this.generateDillTemplate = null;
    this.render = null;
    this.change = null;
    this.runChangeOnEvents = true;

    Object.seal(this);
};

/*
    This function takes an object of attributes and acts in four ways.
     - If the attribute name ends in --- then add this element to the data.
     - If the attribute name ends in -- then add an event to the element.
     - If the attribute name ends in - then this attribute value will be set from a property on the data.
     - Any other valid property (doesn't start with 'dill-') then this is a normal attribute and will be rendered as such.
    Attributes are not added during the template stage but the render stage.
*/
const templateAttributes = (
    element,
    attributes,
    data
) => {

    if (!attributes) {
        return [];
    }

    return forEach(Object.entries(attributes), attribute => {
        const [name, value] = attribute;

        if (name.substr(name.length - 3) === "---") {
            data[name.substring(0, name.length - 3)] = element;
            return 0;
        }

        if (name.substr(name.length - 2) === "--") {

            const eventName = name.substring(0, name.length - 2);

            element.addEventListener(eventName, event => {



// <
//  Get the result of the function that runs on this event.
                const result = data[value](event, element);
// >



// <
//   If this result is false then do not run any rerenders.
                if (result === false) {
                    return;
                }
// >



                site.runChangeOnEvents && site.change(data);

            });

            return 0;
        }

        if (name.charAt(name.length - 1) === "-") {
            
/* Render initial attribute. */
            const newValue = resolveData(data, value);

            elementProperties.includes(name.substring(0, name.length - 1))
                ? (element[name.substring(0, name.length - 1)] = newValue)
                : element.setAttribute(name.substring(0, name.length - 1), newValue);

            return new Attribute(name.substring(0, name.length - 1), value, true);
        }

        if (name.substr(0, 5) === "dill-") {
            return 0;
        }

/* Render initial attribute. */
        const newValue = deBracer(value, data);
        elementProperties.includes(name)
            ? (element[name] = newValue)
            : element.setAttribute(name, newValue);

        return new Attribute(name, value);
    });
};

const getAllHtmlElementTemplatesFromComponent = (component, arr = []) => {
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
};

const getPreviousHtmlTemplate = (dillModel, template) => {

    const templatesOnPage = dillModel.parentTemplate.childTemplates.filter(x => x === template || !x.dillIf || x.dillIf.currentValue);
    const templateIndex = templatesOnPage.indexOf(template);
    let previousHtmlTemplate = templatesOnPage[templateIndex - 1];
    if (!previousHtmlTemplate || !previousHtmlTemplate.Component) {
        return previousHtmlTemplate;
    }

    return getAllHtmlElementTemplatesFromComponent(previousHtmlTemplate).pop();
};

const getAllHtmlTemplatesFromChildTemplates = childTemplates => {
    return childTemplates
        .map(x => x.Component ? getAllHtmlElementTemplatesFromComponent(x) : x)
        .reduce((a, b) => (b instanceof Array ? a.push(...b) : a.push(b), a), []);
};

const getHtmlAndComponentChildTemplates = (templates, arr = []) => {
    forEach(templates, template => {
        arr.push(template);
        if (template.Component) {
            getHtmlAndComponentChildTemplates(template.childTemplates, arr);
        }
    });
    return arr;
};

const insertAfter = (parentElement, previousSiblingElement, incomingElement) => {
    if (!previousSiblingElement) {
        if (parentElement.children.length === 0) {
            parentElement.appendChild(incomingElement);
        }
        else {
            parentElement.insertBefore(incomingElement, parentElement.children[0]);
        }
        return;
    }
    const hasNextElement = previousSiblingElement.nextSibling !== null;
    if (hasNextElement) {
        parentElement.insertBefore(incomingElement, previousSiblingElement.nextSibling);
    }
    else {
        parentElement.appendChild(incomingElement);
    }
};

// import { resolveData } from "./resolve-data.logic";

const fireEvents = (template, eventName) => {

/* If template has a dillIf and its false then element won't be rendered so do not run event. */
    if (!!template.dillIf && !template.dillIf.currentValue) {
        return;
    }

/* Handle a list of elements here */
    if (template.dillFor) {
        // const newLength = resolveData(template.data, template.dillFor.value).length;
        // forEach(template.dillFor.templates.slice(0, newLength), x =>  fireEvents(x, eventName));
        forEach(template.dillFor.templates, x =>  fireEvents(x, eventName));
        return;
    }

/* Only run when at the root of the Component being checked, instead of running for every child element. */
    if (template.Component && template.data.hasOwnProperty(eventName)) {
        template.data[eventName]();
    }

/* Cycle through child templates too. */
    forEach(template.childTemplates, x =>  fireEvents(x, eventName));
};

const DillIf = function(
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
};

const templateDillIf = (
    parentTemplate,
    rootElement,
    element,
    attributes,
    data,
    dillElement,
    isSvgOrChildOfSVG
) => {
    if (!attributes["dill-if"]) {
        return;
    }

    const invertedCondition = attributes["dill-if"].charAt(0) === "!";
    const value = attributes["dill-if"].substr(invertedCondition ? 1 : 0);
    const currentValue = resolveData(data, value);

/* Delete the property here so that we don't create two templates for DillIf. */
    delete attributes["dill-if"];

    return new DillIf(
        parentTemplate,
        rootElement,
        element,
        value,
        invertedCondition ? !currentValue : currentValue,
        dillElement,
        isSvgOrChildOfSVG,
        invertedCondition
    );
};

const renderDillIf = (
    dillIf,
    template,
    data
) => {
    if (!dillIf) {
        return;
    }

    const oldValue = dillIf.currentValue;
    const firstValue = resolveData(data, dillIf.value);
    const newValue = dillIf.invertedCondition ? !firstValue : firstValue;
    const changedToTrue = oldValue === false && newValue === true;
    const changedToFalse = oldValue === true && newValue === false;
    const isComponent = !!template.Component;
    
    if (changedToTrue) {

/* If this Template has never been added to the document then we need to generate a Template for it here. */
        if (!dillIf.templated) {

    /* An intermediate Element is needed as the rootElement to generate a new Template. */
            const intermediary  = document.createElement("DIV");

            const childTemplates = site.generateDillTemplate(
                template,
                isComponent ? intermediary : template.htmlElement,
                data,
                isComponent ? dillIf.dillElement.Component.component.elements : dillIf.dillElement.childTemplates,
                dillIf.isSvgOrChildOfSVG
            );

        /* Build Component inherited properties. */
            const attributes = {...(dillIf.dillElement.attributes || {})};
            templateDillExtends(attributes, data);
            if (isComponent) {
                componentAttributes(
                    attributes,
                    data,
                    data._parent
                );
            }
            else {
                template.attributes.push(
                    ...templateAttributes(
                        template.htmlElement,
                        attributes,
                        data
                    )
                );
            }

        /* We need to make sure that these new childTemplates have the correct rootElement, not the intermediate Element. */
            isComponent && forEach(getHtmlAndComponentChildTemplates(childTemplates), x => x.rootElement = template.rootElement);

            template.childTemplates = childTemplates;

            dillIf.templated = true;

/* Lifecycle hooks. */
            fireEvents(template, "oninit");
        }

/* Add the new Elements to the document. */
        let previousHtmlTemplate = getPreviousHtmlTemplate(dillIf, template);
        const allHtmlTemplates = isComponent
            ? getAllHtmlTemplatesFromChildTemplates(template.childTemplates)
            : [template];

        forEach(allHtmlTemplates, elementTemplate => {
            insertAfter(
                template.rootElement,
                previousHtmlTemplate && previousHtmlTemplate.htmlElement,
                elementTemplate.htmlElement
            );
            previousHtmlTemplate = elementTemplate;
        });

        dillIf.currentValue = true;

/* Lifecycle hooks. */
        fireEvents(template, "oninserted");
        setTimeout(() => fireEvents(template, "onaftercontent"), 0);

    }

    if (changedToFalse) {
        const allHtmlTemplates = isComponent
            ? getAllHtmlTemplatesFromChildTemplates(template.childTemplates)
            : [template];

        forEach(allHtmlTemplates, element => {
            element.htmlElement.parentNode.removeChild(element.htmlElement);
        });

        dillIf.currentValue = false;
    }

    return dillIf;
};

const createData = (newData, parentData) => {
    const Data = function(){
        for (let key in newData) {
            let _value = newData[key];
            define(this, key, () => _value, value => _value = value, dillDataPropertyDefinitions);
        }
        if (parentData !== undefined) {
            this._parent = parentData;
        }
    };
    Data.prototype = parentData === undefined
        ? {}
        : parentData;
    return new Data();
};

const cleanData = (targetObject, mapObject, index, parentData) => {

    if (!targetObject.hasOwnProperty("_item")) {
        addProperty(targetObject, "_item", mapObject);
    }
    else if (targetObject._item !== mapObject) {
        targetObject._item = mapObject;
    }



    if (!targetObject.hasOwnProperty("_index")) {
        addProperty(targetObject, "_index", index);
    }
    else if (targetObject._index !== index) {
        targetObject._index = index;
    }



    if (!targetObject.hasOwnProperty("_parent")) {
        addProperty(targetObject, "_parent", parentData);
    }



    if (!(mapObject instanceof Object)) {
        return targetObject;
    }



    // for (let key in targetObject) {
    //     if (key === "_item" || key === "_index" || key === "_parent") {
    //         continue;
    //     }
    //     if (Object.prototype.hasOwnProperty.call(targetObject, key)
    //         && mapObject[key] === undefined) {
    //         delete targetObject[key];
    //     }
    // }



    for (let key in mapObject) {
        delete targetObject[key];
        addProperty(targetObject, key, mapObject[key]);
    }

    return targetObject;
};

const DillFor = function(
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
};

const templateDillFor = (
    parentTemplate,
    rootElement,
    element,
    attributes,
    data,
    dillElement,
    isSvgOrChildOfSVG
) => {
    if (!attributes["dill-for"]) {
        return;
    }

    const value = attributes["dill-for"];

/* Delete the property here so that we don't create two templates for DillIf. */
    delete attributes["dill-for"];

    return new DillFor(
        parentTemplate,
        rootElement,
        element,
        value,
        0,
        dillElement,
        isSvgOrChildOfSVG
    );
};

const renderDillFor = (
    dillFor,
    template,
    data
) => {

    const newValue = resolveData(data, dillFor.value);
    const oldLength = dillFor.currentLength;
    const newLength = newValue instanceof Array ? newValue.length : 0;

    let newList = dillFor.templates;

    if (oldLength < newLength) {

/*
    This intermediate Element is used to provide a root Element that the generate Template is looking for.
    It is not used usewhere, we just need it to be able to generated a Template.
*/
        const intermediary  = document.createElement("DIV");

        dillFor.templates.push(
            ...newValue.slice(oldLength - newLength)
            .map((x, i) => {
                const newData = cleanData(createData({}, data), x, oldLength + i, data);

        /* Clone Template for each new For item. */
                const newDillElement = {...dillFor.dillElement};
                newDillElement.attributes = {...newDillElement.attributes};
                delete newDillElement.attributes["dill-for"];

        /*
            Generate a new Template for the cloned Template.
            This Template generation will always return an Array with one item, we destructure the Array here to get that one value.
        */
                const [newTemplate] = site.generateDillTemplate(
                    template,
                    intermediary,
                    newData,
                    newDillElement,
                    dillFor.isSvgOrChildOfSVG
                );

        /*
            The new Templates all have the intermediary value as their rootElement.
            In order to change this we to get all the templates that have this as the rootElement, inside Components.
        */
                forEach(getHtmlAndComponentChildTemplates([newTemplate]), x => x.rootElement = template.rootElement);

                return newTemplate;
            })
        );

/*
    Add the new HTML Elements to the parent Element.
    This includes all Elements that are children of any Components.
*/
        const previousHtmlTemplate = oldLength === 0
            ? getPreviousHtmlTemplate(dillFor, template)
            : dillFor.templates[oldLength - 1];

        let previousElement = previousHtmlTemplate && (
            previousHtmlTemplate.Component
                ? getAllHtmlElementTemplatesFromComponent(previousHtmlTemplate)
                : [previousHtmlTemplate]
            )
            .pop().htmlElement;

        forEach([...intermediary.children], element => {
            insertAfter(
                template.rootElement,
                previousElement,
                element
            );
            previousElement = element;
        });

        newList = dillFor.templates.slice(0, oldLength);
    }

    else if (oldLength > newLength) {

/* Remove all HTML Elements from the parent Element that drop off the list at the end. */
        forEach(dillFor.templates.slice(newLength), each => {
            const htmlTemplates = each.Component
                ? getAllHtmlElementTemplatesFromComponent(each)
                : [each];

            forEach(htmlTemplates, each => {
                each.htmlElement.parentNode.removeChild(each.htmlElement);
            });
        });

        dillFor.templates = dillFor.templates.slice(0, newLength);

        newList = dillFor.templates;
    }

    forEach(newList, (x, i) => {
        cleanData(x.data, newValue[i], i, data);
    });
    forEach(dillFor.templates, site.render);

    dillFor.currentLength = newLength;
};

const templateComponent = (
    parentTemplate,
    rootElement,
    parentData,
    dillElement,
    isSvgOrChildOfSVG
) => {
    // console.log("Debugging: ", dillElement.Component.name);
    // debugger;


// <
//  Create a new Data object from this Component and add it to the data tree.
    const componentData = createData(new dillElement.Component(), parentData);
// >



// <
//  Add a property this this new data that contains all the dillElements that were inside this instance of the Component.
//  This will allow them to be added in somewhere in the content if we want.
    addProperty(
        componentData,
        "_template",
        dillElement.childTemplates
    );
// >



/* Get a clone of the Component attributes. */
    const attributes = {...(dillElement.attributes || {})};

/* Dill tool to add many attribtues to an element or Component. dill-extends */
    templateDillExtends(attributes, componentData);

    {
        const quickLookUp = [
            parentTemplate,
            rootElement,
            dillElement.Component,
            attributes,
            parentData,
            dillElement,
            isSvgOrChildOfSVG
        ];
    
/* Handle dill-if and dill-for attributes. */
/* DillIf is a conditional flag for whether we should add this element or not. */
        var dillIf = templateDillIf(...quickLookUp);
/* DillFor is a repeat flag that will loop over an Array and clone the target. */
        var dillFor = templateDillFor(...quickLookUp);
    }

/* DillIf and DillFor are structural changes and affect what will be rendered. This variable captures what should happen next. */
    const elementWillBeRendered = !dillFor && (!dillIf || dillIf.currentValue);
    // const elementWillBeRendered = true;

/*
    Component attributes represent a unique mapping to a given Component.
    This new data is written straight to this new instance of the given Component base.
*/
    elementWillBeRendered && componentAttributes(attributes, componentData, parentData);

/* We create a new template. */
    const newTemplate = new Template(
        rootElement,
        dillElement,
        componentData,
        null,
        {
            dillIf,
            dillFor
        }
    );

/*
    We add this property to the new data. This allows the context to be exposed to the app.
    We do this so that rerendering can be targetted and therefore made more efficient.
*/
    componentData._dillContext = newTemplate;

/* Lifecycle hooks. */
    elementWillBeRendered && componentData.hasOwnProperty("oninit") && componentData.oninit();
    elementWillBeRendered && componentData.hasOwnProperty("oninserted") && componentData.oninserted();

/* Recursively continue to check child templates. */
    newTemplate.childTemplates = elementWillBeRendered
        ? site.generateDillTemplate(
        // ? (circularDependencyCallBack && circularDependencyCallBack(
            newTemplate,
            rootElement,
            componentData,
            dillElement.Component.component.elements,
            isSvgOrChildOfSVG
        // ))
        )
        : [];

/* Lifecycle hook. */
    elementWillBeRendered && componentData.hasOwnProperty("onaftercontent") && componentData.onaftercontent();

    return newTemplate;
};

const SaveChildTemplates = function(
    referenceData,
    childTemplates = null
){
    this.referenceData = referenceData;
    this.childTemplates = childTemplates;

    Object.seal(this);
};

const DillTemplate = function(
    lookup,
    referenceData
){
    this.lookup = lookup;
    this.savedComponents = [
        new SaveChildTemplates(referenceData)
    ];
};

const templateDillTemplate = (
    data,
    attributes
) => {

    const { "dill-template": lookup } = attributes;

    if (!lookup) {
        return;
    }

    const referenceData = resolveData(data, lookup);

    return new DillTemplate(
        lookup,
        referenceData,
    );
};

const renderDillTemplate = (
    template,
    htmlElement,
    data,
    dillTemplate,
    isSvgOrChildOfSVG
) => {

    if (!dillTemplate || !(dillTemplate instanceof DillTemplate)) {
        return;
    }

    const referenceData = resolveData(data, dillTemplate.lookup);
    let childTemplates;
    const savedTemplate = dillTemplate.savedComponents.find(x => x.referenceData === referenceData);

    reverseForEach(htmlElement.childNodes, x => x.parentNode.removeChild(x));

    if (!savedTemplate || savedTemplate.childTemplates === null) {

        childTemplates = site.generateDillTemplate(
            template,
            htmlElement,
            data,
            referenceData,
            isSvgOrChildOfSVG
        );

        if (!savedTemplate) {
            dillTemplate.savedComponents.push(
                new SaveChildTemplates(referenceData, childTemplates)
            );
        }
        else {
            savedTemplate.childTemplates = childTemplates;
        }

        template.childTemplates.length = 0;
        template.childTemplates.push(...childTemplates);
    }
    else {
        template.childTemplates.length = 0;
        template.childTemplates.push(...savedTemplate.childTemplates);
        const htmlElements = getAllHtmlTemplatesFromChildTemplates(savedTemplate.childTemplates);
        forEach(htmlElements, x => htmlElement.appendChild(x.htmlElement));
        fireEvents(template, "oninserted");
    }
};

const templateHtmlElement = (
    parentTemplate,
    rootElement,
    parentData,
    dillElement,
    isSvgOrChildOfSVG
) => {

/*
    SVG Elements are not HTML and therefore we need to know when we are inside SVG so that we can produce SVG Elements.
    The rule is simple, if we enter an <svg> tag that and every child of that will be an SVG Element.
*/
    if (dillElement.nodeName === "svg") {
        isSvgOrChildOfSVG = true;
    }

/* Create the HTML Element for this Template. */
    const htmlElement = isSvgOrChildOfSVG
        ? document.createElementNS("http://www.w3.org/2000/svg", dillElement.nodeName)
        : document.createElement(dillElement.nodeName);

/* Clone the Template attributes. */
    const attributes = {...(dillElement.attributes || {})};

/* Dill tool to add many attribtues to an element or Component. dill-extends */
    templateDillExtends(attributes, parentData);

    {
        const quickLookUp = [
            parentTemplate,
            rootElement,
            htmlElement,
            attributes,
            parentData,
            dillElement,
            isSvgOrChildOfSVG
        ];
/* Handle dill-if and dill-for attributes. */
/* DillIf is a conditional flag for whether we should add this element or not. */
        var dillIf = templateDillIf(...quickLookUp);
/* DillFor is a repeat flag that will loop over an Array and clone the target. */
        var dillFor = templateDillFor(...quickLookUp);
    }

/* DillIf and DillFor are structural changes and affect what will be rendered. This variable captures what should happen next. */
    const elementWillBeRendered = !dillFor && (!dillIf || dillIf.currentValue);
    // const elementWillBeRendered = true;

/*
    This function takes the list of attributes on the Template and checks them, removing any attribute which is not valid and has another purpose.
    We then save the attributes that will be checked on each rerender.
*/
    const attributesForTemplate = elementWillBeRendered
        ? templateAttributes(
            htmlElement,
            attributes,
            parentData
        )
        : [];

/* Add this HTML to the document. */
    elementWillBeRendered && rootElement.appendChild(htmlElement);

/* Handle the attribute dill-template. */
    const dillTemplate = elementWillBeRendered && templateDillTemplate(
        parentData,
        attributes,
        // dillElement
    );

/* We create a new template. */
    const newTemplate = new Template(
        rootElement,
        htmlElement,
        parentData,
        attributesForTemplate,
        {
            dillIf,
            dillFor,
            dillTemplate
        }
    );

/* Recursively continue to check child templates. */
    newTemplate.childTemplates = elementWillBeRendered
        ? site.generateDillTemplate(
            newTemplate,
            htmlElement,
            parentData,
            dillElement.childTemplates,
            isSvgOrChildOfSVG
        )
        : [];

    return newTemplate;
};

/*
    Dill works in two parts.
     - Create templates that represent HTML and data.
     - Render templates.

    The following function generates Templates.
    A Dill Template not only contains information about what is on the page and the data that reflections what to show on the page.
    The templating process is also the way we add the Elements to the page.
    A render only updates the Elements already on the page.
*/
const generateDillTemplate = (
    parentTemplate,
    rootElement,
    parentData,
    dillElements,
    isSvgOrChildOfSVG = false
) => {

/*
    We only allows Arrays. This makes this easier to predict in the code.
    We force the value to be an Array below.
*/
    if (!(dillElements instanceof Array)) {
        dillElements = [dillElements];
    }

/*
    There are three types of template we can create, each one is handled below.
     - Textnode. A simple HTML Element that is used to put text inside other HTML Elements.
     - A Dill Component. This contains child templates but does not render anything itself.
     - A single HTML Element. Can have child templates.
*/
    return forEach(dillElements, dillElement => {
        if (typeof dillElement === "string") {
            return templateTextNode(rootElement,
                parentData,
                dillElement
            );
        }
        else if (!!dillElement.Component) {
            return templateComponent(parentTemplate,
                rootElement,
                parentData,
                dillElement,
                isSvgOrChildOfSVG,
                // (a,b,c,d,e) => generateDillTemplate(a,b,c,d,e)
            );
        }
        else if (!!dillElement.nodeName) {
            return templateHtmlElement(parentTemplate,
                rootElement,
                parentData,
                dillElement,
                isSvgOrChildOfSVG,
                // (a,b,c,d,e) => generateDillTemplate(a,b,c,d,e)
            );
        }
    });
};

site.generateDillTemplate = generateDillTemplate;

const renderAttributes = (element, attributes, data) => {

    if (!attributes) {
        return;
    }

    forEach(attributes, attribute => {

        const {name, value, dillAttribute} = attribute;

        const oldValue = elementProperties.includes(name)
            ? element[name]
            : (element.attributes[name] && element.attributes[name].nodeValue);
        const newValue = dillAttribute
            ? resolveData(data, value)
            : deBracer(value, data);

        if (oldValue !== newValue) {
            if (elementProperties.includes(name)) {
                element[name] = newValue;
            }
            else if (newValue === false || newValue === undefined) {
                element.removeAttribute(name);
            }
            else {
                element.setAttribute(name, newValue);
            }
        }
    });
};

const renderTextNode = (element, value, data) => {

    const oldValue = element.nodeValue;
    const newValue = deBracer(value, data);

    if (oldValue !== newValue) {
        element.nodeValue = newValue;
    }
};

/*
    This function takes a Template instance and updates the connected element using the latest values.
    - We can ignore Components.
    - Only text nodes have content which we can update, they do not have attributes.
    - We only need to update the attributes of a HTML Element.
    - We don't need to change event listeners as this is handled in the Template stage.
*/
const render = template => {



    if (template instanceof Array) {
        forEach(template, render);
        return;
    }



// Debugging
    // console.log("Template: ", template);

    const { htmlElement, textNode, textValue, attributes, data, dillTemplate, dillIf, dillFor, isSvgOrChildOfSVG } = template;


    if (!!textNode) {
        return renderTextNode(textNode, textValue, data);
    }



    const newDillIf = renderDillIf(dillIf, template, data);



    if (newDillIf && !newDillIf.currentValue) {
        return;
    }



    if (!!dillFor) {
        renderDillFor(dillFor, template, data);
        return;
    }



    !!htmlElement && renderAttributes(htmlElement, attributes, data);



    !!htmlElement && renderDillTemplate(template, htmlElement, data, dillTemplate, isSvgOrChildOfSVG);



    fireEvents(template, "onchange");



    template.childTemplates instanceof Array && forEach(template.childTemplates, render);
};

site.render = render;

const initiateApp = (
    rootElement,
    Data,
    dillElement
) => {



// <
//  Create a new app.
//  By normal methods only one app can exist on the site at once (site.app property).
//  However dill simply works by calling render and passing in a Template.
//  If means that you can create any number of apps if they are saved somewhere in the app.
//  This means the Dev can create portal apps.
// >



// >
//  This newData will be the root data for the whole site.
    const newData = createData(new Data());
// >



// >
//  Lifecycle hook.
    newData.onpretemplate && newData.onpretemplate();
// >



// >
//  Generate the site template.
    site.app = generateDillTemplate(null, rootElement, newData, dillElement, false);
// >


// >
//  Lifecycle hook.
    newData.oninit && newData.oninit();
// >



// >
//      Render the site for the first time.
    render(site.app);
// >



// >
//  Return the root data.
//  This allows access to the rootdata outside the app.
//  If the root element was a Component then this data will contain the _dillContext property which will allow the app Template to be accessed and saved.
//  This allows the creation of portal apps.
    return newData;
// >

};

const change = componentContext => {

/*
    Calling dill.change() will cause a rerender of a given Component.
    If no Component is provided then the whole app gets reendered.
    This is not great for performance.
    When an event fires in runs a rerender globally by default but this can be prevented by writing code to target specific Components to rerender.
*/

    if (!!componentContext) {
        site.devMode && console.log("DILL DEV. CONTEXT PASSED TO DILL.CHANGE -> ", componentContext._dillContext);
        render(componentContext._dillContext);
    }
    else if (site.strictMode === false) {
        render(site.app);
    }
    else {
        console.warn("dill.change() was called with undefined will in strict mode, no render will be fired.");
    }
};

site.change = change;

const DillElement = function(
    element,
    attributes,
    childTemplates
){

/*
    A dill element can either be a Component or a HTML element.
    e.g
    <Component />
    or
    <div></div>
    We check for which one this is below.
*/
    if (typeof element === "string") {
        this.nodeName = element;
    }
    else if (element instanceof Function) {
        this.Component = element;
    }

    this.attributes = attributes;

    this.childTemplates = (
        childTemplates instanceof Array
            ? childTemplates
            : [childTemplates]
    );

    Object.freeze(this);
};

const dill = new function Dill(){

    this.element = function(
        element,
        attributes,
        childTemplate
    ){
        return new DillElement(
            element,
            attributes,
            childTemplate instanceof Array
                ? childTemplate
                : [...arguments].slice(2)
        );
    };

    this.setStrictMode = () => site.strictMode = true;
    this.setDevMode = () => site.devMode = true;
    this.setDoNotRunChangeOnEvents = () => site.runChangeOnEvents = false;

    this.Component = Component;

    this.create = initiateApp;

    this.change = change;
};

export { dill };
