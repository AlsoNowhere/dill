'use strict';

var baseForEach = function(initialIncrement, howToEndWhile, increment){
    return function(array, callback){
        var i = initialIncrement(array),
            result,
            newArray = [];
        while (howToEndWhile(i,array)) {
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

var forEach = baseForEach(
    function(){
        return 0;
    },
    function(i, array){
        return i < array.length;
    },
    1
);

var forReverseEach = baseForEach(
    function(array){
        return array.length - 1;
    },
    function(i){
        return i >= 0;
    },
    -1
);

var styles = function(colour1,colour2) {
    return "display: block;"
    +"width: 100%;"
    +"padding: 5px 7px;"
    +'background-color: ' + colour1 + ';'
    +'border: 2px solid ' + colour2 + ';'
    +"border-radius: 5px;"
    +"font-weight: bold;"
    +"color :white;"
    +"font-family: sans-serif;"
    +"line-height: 28px;"
    +"font-size: 18px;"
    +"text-align: center;";
};

var warnStyles = styles("orange","orange");
var errorStyles = styles("tomato","red");

var loggerBase = function(){
    return function(type,styles) {
        return function(functionName, message) {
            if (message === undefined) {
                message = functionName;
                functionName = null;
            }
            console.log("%c" + (functionName === null ? "" : (type + " at: " + functionName)),styles);
            console.log('%cMessage: ' + message, styles);
        }
    }
}();

var logger = {
    warn: loggerBase("Warning",warnStyles),
    error: loggerBase("Error",errorStyles)
};

var Module = function(name, components){
    this.name = name;
    this.components = components;
    this.setComponent = function(Component){
        components[Component.component.name] = {
            Component: Component,
            template: Component.component.template,
            module: this,
            isolated: Component.component.isolated
        };
        return this;
    };
};

var dillModule = function(name,modulesToExtend){
    var component,
        components = {};
// -- Development only --
    if (name === undefined || typeof name !== "string" || name === "") {
        return logger.error(".module method - name argument","You must pass a name to the module.");
    }
    if (modulesToExtend !== undefined && !(modulesToExtend instanceof Array)) {
        return logger.error(".module method - modules to extend argument","You must pass undefined or an Array.");
    }
// /-- Development only --
    if (modulesToExtend === undefined) {
        modulesToExtend = [];
    }
    forEach(modulesToExtend,function(eachModule){
        for (component in eachModule.components) {
            if (!components[component] && eachModule.components[component].isolated !== true) {
                components[component] = eachModule.components[component];
            }
        }
    });
    return new Module(name,components);
};

var isSurroundedBy = function(value, start, end){
    if (end === undefined) {
        end = start;
    }
    return value.substr(0,start.length) === start && value.substr(value.length - end.lenth,end.length);
};

var resolveData = function(data,value){
    var output = data[value] instanceof Function
        ? data[value]()
        : data[value];
    return output === undefined ? "" : output;
};

var deBracer = function(string,data){
// To do: Be able to escape braces if there is a preceding backslash(\). Remove the preceding backslash.
    return string.replace(/{[A-Za-z0-9_]+}/g,function(match){
        return resolveData(data,match.substring(1,match.length-1));
    });
};

var elementProperties = ["value","checked"];

var renderAttributes = function(template){
    var data = template.data;
    var element = template.element;

    if (!template.attributes) {
        return;
    }

    forEach(template.attributes,function(attribute){
        var name;
        var value;
        if (attribute.name.substr(0,1) === attributeSpecialCharacter) {
            name = attribute.name.replace(attributeSpecialCharacter,"");
            value = resolveData(data,attribute.value);
            if (elementProperties.indexOf(name) > -1) {
                element[name] = value;
            }
            else if (value === false || value === "") {
                element.removeAttribute(name);
            }
            else {
                element.setAttribute(name,value);
            }
        }
        else {
            element.setAttribute(attribute.name,deBracer(attribute.value,data));
        }
    });
};

var fireOnInsertedEvents = function(template){
    if (template.component && template.data.hasOwnProperty("oninserted")) {
        template.data.oninserted();
    }
    template.childTemplates && forEach(template.childTemplates,function(x){
        if (x.if && !x.if.initialValue) {
            return;
        }
        fireOnInsertedEvents(x);
    });
};

var renderIf = function(template,index){
    var element = template.element;
    var data = template.data;
    var newValue = resolveData(data,template.if.value);
    var newTemplate;
    if (template.if.inverse) {
        newValue = !newValue;
    }
    if (newValue && template.if.initialValue) {
        return;
    }
    else if (newValue && !template.if.initialValue) {
        if (template.if.parent.childNodes.length === 0 || template.if.parent.childNodes.length === index) {
            template.if.parent.appendChild(element);
        }
        else {
            template.if.parent.insertBefore(element,template.if.parent.childNodes[index]);
        }
        if (!template.if.templated) {
            newTemplate = new Template(template._module,template.data,element);
            template.childTemplates = newTemplate.childTemplates;
            template.attributes = newTemplate.attributes;
            template.if.templated = true;
        }
        fireOnInsertedEvents(template);
        template.if.initialValue = true;
        render(template,index);
        return 2;
    }
    else if (!newValue && template.if.initialValue) {
        template.if.parent.removeChild(element);
        template.if.initialValue = false;
        return 0;
    }
    return 1;
};

var defineProperty = function(obj,key,initialValue){
    var _value = initialValue;
    Object.defineProperty(obj,key,{
        get: function(){
            return _value;
        },
        set: function(value){
            _value = value;
        },
// Setting this to true (default is false) means that this property can be removed.
        configurable: true
    });
};

var createData = function(newData,parentData){
    var Data = function(){
        var key;
        for (key in newData) {
            defineProperty(this,key,newData[key]);
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

var DillFor = function(_item,_index){
    this._item = _item;
    this._index = _index;
};

var renderFor = function(template,index){
    var initialCount;
    var parent;
    var list;
    var clone;
    var i = 0;
    var newClone;
    if (!template.for) {
        return;
    }
    initialCount = template.for.initialCount;
    parent = template.for.parent;
    list = resolveData(template.data,template.for.value);
    clone = template.for.clone;

    if (initialCount > list.length) {
        for (; i < initialCount - list.length ; i++) {
            parent.removeChild(parent.childNodes[index]);
            template.for.templates.shift();
        }
    }
    else if (initialCount < list.length) {
        for (; i < list.length - initialCount ; i++) {
            newClone = clone.cloneNode(true);
            parent.insertBefore(newClone,parent.childNodes[index+initialCount+i]);
            template.for.templates.push(
                new Template(template._module,
                    createData(new DillFor(list[initialCount+i],initialCount+i),template.data),
                    newClone,
                    template
                )
            );
        }
    }
    template.for.initialCount = list.length;
    forEach(list,function(listItem,i){
        var key;
        var relevantTemplate = template.for.templates[i];
        var data = relevantTemplate.data;
        if (listItem instanceof Object) {
            for (key in data) {
                if (!listItem.hasOwnProperty(key)) {
                    delete data[key];
                }
            }
            for (key in listItem) {
                data[key] = listItem[key];
            }
        }
        data._item = listItem;
        data._index = i;
        data._parent = template.data;
        render(relevantTemplate);
    });

    return list.length;
};

var renderDillTemplate = function(template){
    var element;
    var value;
    var newTemplate;
    if (!template.dillTemplate) {
        return;
    }
    value = resolveData(template.data,template.dillTemplate.property);
    if (value === template.dillTemplate.initialValue) {
        return;
    }
    element = template.element;
    template.dillTemplate.initialValue = value;
    element.innerHTML = value;
    newTemplate = new Template(template._module,template.data,element,template);
    template.childTemplates = newTemplate.childTemplates;
};

// -- Development only --
// var limit = 0;
// /-- Development only --

var render = function(template,index){

// -- Development only --
// Prevent and infinite loop
    // limit++;
    // if (limit > 500) {
    //     return console.log("Limit reached");
    // }
// /-- Development only --

    var data = template.data;
    var element = template.element;
    var ifResult;

    if (template.name === "#comment" || template.name === "SCRIPT") {
        return;
    }

    if (template.name === "#text") {
        element.nodeValue = deBracer(template.textValue,data);
        return;
    }

    if (template.if) {
        ifResult = renderIf(template,index);
        if (typeof ifResult === "number") {
            return ifResult;
        }
    }

    if (template.for) {
        return renderFor(template,index);
    }

    renderDillTemplate(template);

    renderAttributes(template);

    template.childTemplates && forEach(template.childTemplates,function(x,i){
        render(x,i);
    });
};

var apps = [];

var change = function(template){
    if (template === undefined) {
        return forEach(apps,function(x){
            render(x);
        });
    }
    // To Do: Reload only the given template for better efficiency
    // ...
};

var attributeSpecialCharacter = ":";

var createAttributes = function(template){
    var element = template.element;
    var data = template.data;
    var extendsValue;
    var key;
    var property;

    if (element.attributes["dill-extends"]) {
        extendsValue = resolveData(template.data,element.attributes["dill-extends"].nodeValue);
        for (key in extendsValue) {
            property = key;
            if (isSurroundedBy(key,"[","]")) {
                property = attributeSpecialCharacter + key.substring(1,key.length-1);
            }
            if (isSurroundedBy(key,"(",")")) {
                property = key.substring(1,key.length-1) + attributeSpecialCharacter;
            }
            element.setAttribute(property,extendsValue[key]);
        }
        element.removeAttribute("dill-extends");
    }

    template.attributes = forReverseEach(element.attributes,function(attribute){
        var name = attribute.nodeName;
        var attrName;
        if (name.substr(0,1) === "#") {
            template.data[name.substring(1,name.length)] = element;
            element.removeAttribute(name);
            return 0;
        }
        else if (isSurroundedBy(name,"[","]") || name.substr(0,1) === attributeSpecialCharacter) {
            name = attributeSpecialCharacter + name.substring(
                1,
                isSurroundedBy(name,"[","]")
                    ? attribute.name.length-1
                    : attribute.name.length
            );
            element.removeAttribute(attribute.nodeName);
        }
        else if (isSurroundedBy(name,"(",")") || name.substr(name.length-1,1) === attributeSpecialCharacter) {
            attrName = name.substring(
                isSurroundedBy(name,"(",")")
                    ? 1
                    : 0,
                attribute.name.length-1
            );
            element.addEventListener(
                attrName,
                function(event){
                    var checkForFalse = data[attribute.nodeValue].apply(data,[event,element]);
                    if (checkForFalse !== false) {
                        change();
                    }
                }
            );
            element.removeAttribute(name);
            return 0;
        }
        return {
            name: name,
            value: attribute.nodeValue
        };
    });
};

var createIf = function(template){
    var element = template.element;
    var value;
    var inverse = false;
    var initialValue;
    if (!element.attributes["dill-if"]) {
        return true;
    }
    value = element.attributes["dill-if"].nodeValue;
    if (value.substr(0,1) === "!") {
        value = value.substring(1,value.length);
        inverse = true;
    }
    element.removeAttribute("dill-if");
    initialValue = resolveData(template.data,value);
    if (inverse) {
        initialValue = !initialValue;
    }
    template.if = {
        initialValue: initialValue,
        templated: initialValue,
        value: value,
        inverse: inverse,
        parent: element.parentElement
    };

    if (!initialValue) {
        element.parentElement.removeChild(element);
    }
    
    return initialValue;
};

var createComponent = function(template){
    var element = template.element;
    var name = template.name.toLowerCase();
    var data = template.data;
    var parentData = template.data;
    if (!template._module.components[name]) {
        return false;
    }

    template.data = createData(
        new template._module.components[name].Component(),
        element.attributes["dill-isolate"] ? undefined : parentData
    );
    template.data._template = element.innerHTML;
    element.innerHTML = template._module.components[name].template;
    if (element.attributes["dill-isolate"]) {
        element.removeAttribute("dill-isolate");
    }
    if (template._module.components[name].module !== data._module) {
        template.data._module = template._module.components[name].module;
    }

    template.data._dillTemplate = template;

    template.data.onprerender && template.data.onprerender.apply(template.data);
    
    forReverseEach(element.attributes,function(attribute){
        var name = attribute.nodeName;
        if (name.substr(0,1) === "#") {
            template.data[name.substring(1,name.length)] = element;
        }
        else if (isSurroundedBy(attribute.nodeValue,"'")) {
            template.data[name] = attribute.nodeValue.substring(1,attribute.nodeValue.length-1);
        }
        else {
            Object.defineProperty(template.data,name,{
                get: function(){
                    return parentData[attribute.nodeValue];
                },
                set: function(value){
                    parentData[attribute.nodeValue] = value;
                }
            });
        }
        element.removeAttribute(name);
    });

    return true;
};

var createFor = function(template){
    var element = template.element;
    var value;

    if (!element.attributes["dill-for"]) {
        return;
    }
    value = element.attributes["dill-for"].nodeValue;
    element.removeAttribute("dill-for");
    template.for = {
        initialCount: 0,
        clone: element.cloneNode(true),
        value: value,
        parent: element.parentElement,
        templates: []
    };
    element.parentElement.removeChild(element);
};

var createDillTemplate = function(template){
    var element = template.element;
    var attribute;
    var value;
    if (!element.attributes["dill-template"]) {
        return;
    }
    attribute = element.attributes["dill-template"];
    value = resolveData(template.data,attribute.nodeValue);
    template.dillTemplate = {
        property: attribute.nodeValue,
        initialValue: value
    };
    element.removeAttribute("dill-template");
    element.innerHTML = value;
};

var id = 0;

var Template = function(dillModule,data,element,parentTemplate){
    var isIf;
    this.id = ++id;
    this.parent = parentTemplate || null;
    this.name = element.nodeName;
    this._module = dillModule;
    this.data = data;
    this.element = element;
    if (this.name === "#comment" || this.name === "SCRIPT") {
        return;
    }
    if (this.name === "#text") {
        this.textValue = element.nodeValue;
        return;
    }

    if (element.attributes["dill-ignore"]) {
        return;
    }

    isIf = createIf(this);
    if (!isIf) {
        return;
    }

    if (element.attributes["dill-for"]) {
        createFor(this);
        return;
    }

    this.component = createComponent(this);

    createDillTemplate(this);
    
    if (!this.component) {
        createAttributes(this);
    }

    this.childTemplates = forEach(element.childNodes,function(x){
        return new Template(dillModule,this.data,x,this);
    }.bind(this));

    this.component && this.data.hasOwnProperty("oninit") && this.data.oninit();
};

var create = function(dillModule,Data,element){
    var data = createData(new Data());
    data._module = dillModule;
    var template = new Template(dillModule,data,element);
    apps.push(template);
    data.onprerender && data.onprerender();
    render(template,0);
    data.oninit && data.oninit();
    return data;
};

var Component = function(name, template, isolated){
    this.name = name;
    this.template = template;
    this.isolated = isolated;
};

var reset = function(){
    apps.length = 0;
};

var Dill = function(){
	this.module = dillModule;
	this.create = create;
	this.change = change;
	this.Component = Component;
	this.reset = reset;
};

// CJS | mode
// export var dill = new Dill();

// script src | mode
window.dill = new Dill();
//# sourceMappingURL=dill.js.map
