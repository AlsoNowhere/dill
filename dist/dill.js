(function () {
    'use strict';

    var lockObject = function(obj){
        Object.seal(obj);
        Object.freeze && Object.freeze(obj);
    };

    var error = function(message){
        throw new Error(message);
    };

    var Component = function(name, data, template, isolateState, abstractConditions){
        if (name === "undefined" || name === "") {
            error("You must pass a name to create a Component (!name, data object, HTML template)");
        }
        var _module = null;
        this.name = name;
        this.baseData = data === undefined
            ? {}
            : typeof data === "function"
                ? new data()
                : typeof data === "object"
                    ? data
                    : error("You must pass an object or constructor function to create a Component (name, !data object, HTML template)");
        this.template = template || "";
        this.isIsolated = isolateState === "isolate";
        Object.defineProperty(this,"module",{
            get: function(){
                return _module;
            }
        });
        this.setModule = function(newModule){
            if (_module !== null || !(newModule instanceof Module)) {
                return;
            }
            _module = newModule;
        };
        if (abstractConditions) {
            this.abstractConditions = abstractConditions;
        }
        lockObject(this);
    };

    var setComponent = function(component){
        if (!(component instanceof Component)) {
            throw new Error("You can only set an instance of Dill Component as a component");
        }
        this.components[component.name] = component;
        this.components[component.name].setModule(this);
    };

    var Service = function(name, data, isolateState){
        this.name = name;
        this.data = typeof data === "function"
            ? new data()
            : data;
        this.isIsolated = isolateState === "isolate";
        lockObject(this);
    };

    var setService = function(service){
        if (!(service instanceof Service)) {
            throw new Error("You can only set an instance of Dill Service as a service");
        }
        this.services [service.name] = service;
    };

    var forEach = function(scope, callback){
        var i = 0;
        var result;
        while (i < scope.length) {
            result = callback(scope[i], i);
            if (result === false) {
                break;
            }
            if (typeof result === "number") {
                i += result;
            }
            i++;
        }
    };

    var reverseForEach = function(scope, callback){
        var i = scope.length - 1;
        var result;
        while (i >= 0) {
            result = callback(scope[i], i);
            if (result === false) {
                break;
            }
            if (typeof result === "number") {
                i -= result;
            }
            i--;
        }
    };

    var Module = function(){
        var Module = function(name, modules){
            var _module = this;
            if (modules === undefined) {
                modules = [];
            }
            this.components = {};
            this.services = {};
            this.name = name;
            forEach(modules,function(eachModule){
                if (!(eachModule instanceof Module)) {
                    return;
                }
                Object.keys(eachModule.components).forEach(function(key){
                    var component = eachModule.components[key];
                    if (component.isIsolated) {
                        return;
                    }
                    _module.components[key] = component;
                });
                Object.keys(eachModule.services).forEach(function(key){
                    var service = eachModule.services[key];
                    if (service.isIsolated) {
                        return;
                    }
                    _module.services[key] = service;
                });
            });
            lockObject(this);
        };
        Module.prototype = {
            setComponent: setComponent,
            setService: setService
        };
        return Module;
    }();

    var renders = [];

    var strEvaluator = function(str, data){
        var value = data[str];
        if (value === undefined) {
            value = "";
        }
        var isStringFormat = str.substr(0, 1) === "'" && str.substr(str.length-1, 1) === "'";
        if (isStringFormat) {
            return str.substring(1, str.length-1);
        }
        if (typeof value === "function") {
            return value.apply(data);
        }
        return value;
    };

    var debracer = function(str, data){
        var strParts = str.split("{{");
        forEach(strParts, function(each, index){
            var end = each.indexOf("}}");
            strParts[index] = end === -1
                ? each
                : strEvaluator(each.substring(0, end), data) + each.substring(end + 2, each.length);
        });
        return strParts.join("");
    };

    var elementProperties = ["value", "checked"];

    var renderAttributes = function(target, template){
        template.attributes && forEach(template.attributes, function(attribute){
            var type = attribute.type;
            var name = attribute.parsed || attribute.name;
            var value = debracer(attribute.value, template.data);
            var output;
            var attributeIsDefined = !!target.attributes[name];

            if (type === "bind") {
                output = typeof template.data[value] === "function"
                    ? template.data[value].apply(template.data)
                    : template.data[value];
                if (elementProperties.indexOf(name) > -1) {
                    if (target[name] === (typeof output === "number" ? output.toString() : output)) {
                        return;
                    }
                    if (target.nodeName === "SELECT") {
                        setTimeout(function(){
                            target[name] = output;
                        },0);
                    }
                    else {
                        target[name] = output;
                    }
                    return;
                }
                if (attributeIsDefined) {
                    if (target.attributes[name].nodeValue === output) {
                        return;
                    }
                    if (output === undefined || output === false) {
                        return target.removeAttribute(name);
                    }
                    target.attributes[name].nodeValue = output;
                    return;
                }
                if (output === undefined || output === false) {
                    return;
                }
                target.setAttribute(name, output);
            }
            // else if (type === "literal") {
            //     target.setAttribute(name, value);
            // }
            else if (type === "default") {
                if (attributeIsDefined) {
                    if (target.attributes[name].nodeValue === value) {
                        return;
                    }
                    target.attributes[name].nodeValue = value;
                    return;
                }
                target.setAttribute(name, value);
            }
        });
    };

    var recurseComponent = function(template,type){
        if (template.component && template.data.hasOwnProperty(type) && typeof template.data[type] === "function") {
            template.data[type]();
        }
        template.children && forEach(template.children,function(x){
            recurseComponent(x,type);
        });
    };

    var createData = function(data, prototype, type){
        var Data = function(){
            for (var item in data) {
                (function(){
                    var _value = data[item];
                    Object.defineProperty(this, item, {
                        get: function(){
                            return _value;
                        },
                        set: function(value){
                            _value = value;
                        }
                    });
                }.apply(this));
            }
            if (prototype !== null && type !== "isolate") {
                this._parent = prototype;
            }
        };
        if (prototype !== null && type !== "isolate") {
            Data.prototype = prototype;
        }
        return new Data();
    };

    var isSurroundedBy = function(name, start, end){
        if (end === undefined) {
            end = start;
        }
        return name.substr(0,start.length) === start
            && name.substr(name.length - end.length, name.length) === end;
    };

    var Template = function(target, data, dillModule, templateParent){
        var name = target.nodeName;

        this.name = target.nodeName;
        this.module = dillModule;

        if (templateParent) {
            this.templateParent = templateParent;
        }

        if (this.name === "#text") {
            this.value = target.nodeValue;
            this.data = data;
            lockObject(this);
            return this;
        }

        this.children = [];

        var component = dillModule.components[name.toLowerCase()],
            componentIsValid = true;

        var checkParentTemplates = function(parent,condition){
            if (!parent.templateParent) {
                return;
            }
            if (parent.component === condition) {
                componentIsValid = true;
                return;
            }
            checkParentTemplates(parent.templateParent,condition);
        };

        if (component && component.abstractConditions) {
            componentIsValid = false;
            forEach(component.abstractConditions,function(condition){
                if (componentIsValid) {
                    return false;
                }
                checkParentTemplates(this,condition);
            }.bind(this));
        }

        if (component !== undefined && componentIsValid) {
            this.component = component;
            if (target.hasAttribute("dill-for")) {
                this.data = data;
                return;
            }

            this.data = createData(
                component.baseData,
                data,
                target.hasAttribute("dill-isolate") && "isolate"
            );

            this.data._module = component.module;
            target.removeAttribute("dill-isolate");

            forEach(target.attributes,function(attribute){
                var name = attribute.nodeName,
                    value = attribute.nodeValue,
                    prop;
                if (isSurroundedBy(name,"[","]")) {
                    prop = name.substring(1,name.length-1);
                    Object.defineProperty(this.data,prop,{
                        get: function(){
                            return data[value];
                        },
                        set: function(setValue){
                            data[value] = setValue;
                        }
                    });
                }
                else {
                    if (isSurroundedBy(value,"'")) {
                        this.data[name] = value.substring(1,value.length-1);
                    }
                    else {
                        this.data[name] = data[value];
                    }
                }
            }.bind(this));

            return;
        }

        this.attributes = [];
        this.data = data;
    };

    var isBinding = function(str){
        return str.substr(0, 1) === ":";
    };

    var isEvent = function(str){
        return str.substr(str.length - 1, 1) === ":";
    };

    var attributeType = function(attribute){
        var name = attribute.nodeName;
        var value = attribute.nodeValue;
        if (isSurroundedBy(name, "[", "]") || isBinding(name)) {
            // if (isSurroundedBy(value, "'")) {
            //     return "literal";
            // }
            return "bind";
        }
        if (isSurroundedBy(name, "(", ")") || isEvent(name)) {
            return "event";
        }
        return "default";
    };

    var AttributeTemplate = function(target, template, attribute){
        this.name = attribute.nodeName;
        var value = attribute.nodeValue;
        if (this.name.substr(0, 1) === "#") {
            template.data[this.name.substring(1)] = target;
            this.type = "hashReference";
            return;
        }
        var parsed = isBinding(this.name)
            ? this.name.substring(1, this.name.length)
            : isEvent(this.name)
                ? this.name.substring(0, this.name.length - 1)
                : this.name.substring(1,this.name.length-1);
        this.type = attributeType(attribute);
        this.value = this.type === "literal"
            ? value.substring(1,value.length-1)
            : value;
        if (this.type !== "default") {
            this.parsed = parsed;
        }
        var value = this.value;
        if (this.type === "event") {
            target.addEventListener(this.parsed, function(event){
                var output = template.data[value].apply(template.data, [event, this]);
                if (output === false) {
                    return;
                }
                dill.change();
            });
            return;
        }
        lockObject(this);
    };

    var dillTemplate = function(target, template){
        var value = target.attributes["dill-template"].nodeValue;
        var data = template.data[value];
        target.innerHTML = typeof data === "function"
            ? data.apply(template.data)
            : data;
        target.removeAttribute("dill-template");
    };

    var dillExtends = function(target, template){
        var values = template.data[target.attributes["dill-extends"].nodeValue];
        target.removeAttribute("dill-extends");
        if (typeof values !== "object") {
            return;
        }
        Object.keys(values).forEach(function(key){
            var newKey = key;
            if (isSurroundedBy(key, "[", "]")) {
                newKey = ":" + key.substring(1, key.length - 1);
            }
            if (isSurroundedBy(key, "(", ")")) {
                newKey = key.substring(1, key.length - 1) + ":";
            }
            target.setAttribute(newKey, values[key]);
        });
    };

    var dillIf = function(target, template){
        var value = target.attributes["dill-if"].nodeValue;
        var invert = value.substr(0, 1) === "!";
        if (invert) {
            value = value.substring(1, value.length);
        }
        var dataValue = typeof template.data[value] === "function"
            ? template.data[value]()
            : template.data[value];
        if (invert) {
            dataValue = !dataValue;
        }
        template.if = {
            parent: target.parentNode,
            first: dataValue,
            initial: true,
            value: value,
            invert: invert,
            target: target
        };
        target.removeAttribute("dill-if");
        return dataValue;
    };

    var dillFor = function(target, template){
        var value = target.attributes["dill-for"].nodeValue;
        template.for = {
            parent: target.parentNode,
            initial: [null],
            templates: [null],
            value: value,
            first: true
        };
        target.removeAttribute("dill-for");
        template.for.clone = target.cloneNode(true);
        return;
    };

    var createTemplate = function(target, data, dillModule, templateParent){
        var template = new Template(target, data, dillModule, templateParent);

        data = template.data;

        if (template.name === "SCRIPT") {
            return template;
        }

        target.attributes && target.attributes["dill-extends"] && (function(){
            dillExtends(target, template);
        }());

        target.attributes && target.attributes["dill-if"] && dillIf(target, template);

        target.attributes && reverseForEach(target.attributes, function(attribute){
            if (!template.if && attribute.nodeName === "dill-template") {
                return;
            }
            if (!template.if && attribute.nodeName === "dill-for") {
                return dillFor(target, template);
            }
            !template.component && template.attributes.push(new AttributeTemplate(target, template, attribute));
        });

        template.attributes && reverseForEach(template.attributes, function cleanUpAttributes(attribute, index){
            if (attribute.type === "event" || attribute.type === "hashReference") {
                template.attributes.splice(index, 1);
            }
            if (attribute.type !== "default") {
                target.removeAttribute(attribute.name);
            }
        });

        if (template.if && template.if.first === false) {
            return template;
        }

        target.attributes && target.attributes["dill-template"] && dillTemplate(target, template);

        template.component && (function(){
            var recursiveComponentElements;
            if (!(template.for ? !template.for.first : !template.for)) {
                return;
            }
            data._template = target.innerHTML;
            target.innerHTML = template.component.template;
            recursiveComponentElements = target.getElementsByTagName(template.component.name.toUpperCase());
            forEach(recursiveComponentElements,function(element){
                var hasConditional = false,
                    currentElement = element;
                while (currentElement !== target && !hasConditional) {
                    hasConditional = currentElement.hasAttribute("dill-if");
                    currentElement = currentElement.parentNode;
                }
                if (!hasConditional) {
                    throw new Error("Recursive element detected without conditional catch. To avoid infinite loop render was stopped.");
                }
            });
            if (data.hasOwnProperty("oninit")) {
                data.oninit();
            }
        }());
        
        if (template.for ? !template.for.first : !template.for) {
            target.childNodes && forEach(target.childNodes, function generateChildTemplates(child){
                template.children.push(createTemplate(child, data, dillModule, template));
            });
        }

        if (template.for) {
            template.for.first = false;
        }

        return template;
    };

    // var recurseComponent = function(template,type){
    //     if (template.component.hasOwnProperty(type) && typeof template.component[type] === "function") {
    //         template.component[type]();
    //     }
    //     forEach(template.childs,function(x){
    //         recurseComponent(x,type);
    //     });
    // }

    var renderIf = function(target, template){
        var data = template.data;
        var invert = template.if.invert;
        var value = template.if.value;
        var dataValue = typeof data[value] === "function"
            ? data[value]()
            : data[value];
        var oldState = template.if.initial;
        var newState = invert
            ? !dataValue
            : !!dataValue;
        var parent = template.if.parent;
        if (oldState === false && newState === false) {
            return 0;
        }
        if (oldState === false && newState === true) {
            target === undefined
                ? parent.appendChild(template.if.target)
                : parent.insertBefore(template.if.target,target);
            if (template.if.first === false) {
                template.if.first = true;
                (function(){

                    template.if.target.attributes
                        && template.if.target.attributes["dill-template"]
                        && dillTemplate(template.if.target, template);

                    if (template.component) {
                        (function(){
                            var recursiveComponentElements;
                            // if (template.for && !template.for.first || !template.for) {
                                template.data._template = template.if.target.innerHTML;
                                template.if.target.innerHTML = template.component.template;
                                recursiveComponentElements = template.if.target.getElementsByTagName(template.component.name.toUpperCase());
                                forEach(recursiveComponentElements,function(element){
                                    var hasConditional = false,
                                        currentElement = element;
                                    while (currentElement !== template.if.target && !hasConditional) {
                                        hasConditional = currentElement.hasAttribute("dill-if");
                                        currentElement = currentElement.parentNode;
                                    }
                                    if (!hasConditional) {
                                        throw new Error("Recursive element detected without conditional catch. To avoid infinite loop render was stopped.");
                                    }
                                });
                                if (template.data.hasOwnProperty("oninit")) {
                                    template.data.oninit();
                                }
                            // }
                        }());
                    }
                    // if (template.for && !template.for.first || !template.for) {
                        template.if.target.childNodes && forEach(template.if.target.childNodes, function generateChildTemplates(child){
                            template.children.push(createTemplate(child, template.data, template.data._module, template));
                        });
                    // }


                }());
            }
            else {
                // console.log("New init: ", template);
                recurseComponent(template,"oninit");
            }
            template.if.initial = true;
            // if (template.component) {
            //     template.data.onadd && template.data.onadd();
            // }


            return "added";
        }
        else if (oldState === true && newState === false) {
            parent.removeChild(template.if.target);
            // if (template.component) {
            //     template.data.onremove && template.data.onremove();
            // }

            recurseComponent(template,"onremove");

            template.if.initial = false;
            return 0;
        }
    };

    var recycleData = function(newData, oldData){
        var item;
        for (item in newData) {
            if (oldData.hasOwnProperty(item)) {
                oldData[item] = newData[item];
            }
            else {
                (function(){
                    var _value;
                    Object.defineProperty(oldData, item, {
                        get: function(){
                            return _value;
                        },
                        set: function(value){
                            _value = value;
                        }
                    });
                    oldData[item] = newData[item];
                }());
            }
        }
        for (item in oldData) {
            if (item.substr(0, 1) === "_") {
                continue;
            }
            if (!newData.hasOwnProperty(item)) {
                delete oldData[item];
            }
        }
    };

    var renderFor = function(target, template, condition){
        var initialLength = template.for.initial.length;
        var value = typeof template.data[template.for.value] === "function"
            ? template.data[template.for.value]()
            : template.data[template.for.value];
        if (value === undefined) {
            throw new Error("Count not find " + template.for.value + " on current scope.");
        }
        var initial = template.for.initial;
        var newLength = value.length;
        var currentTarget = target;
        var parent = template.for.parent;
        var templates = template.for.templates;
        var clone = function(){
            return template.for.clone.cloneNode(true);
        };
        if (initialLength !== newLength) {
            (function(){
                if (initialLength > newLength) {
                    (function(){
                        var i = 0;
                        var next;
                        while (i < newLength) {
                            currentTarget = currentTarget.nextElementSibling;
                            i++;
                        }
                        while (i < initialLength) {
                            next = currentTarget.nextElementSibling;
                            parent.removeChild(currentTarget);
                            recurseComponent(template,"onremove");
                            currentTarget = next;
                            i++;
                        }
                    }());
                }
                if (initialLength < newLength) {
                    (function(){
                        var i = 0;
                        while (i < initialLength - 1) {
                            currentTarget = currentTarget.nextElementSibling;
                            i++;
                        }
                        if (initialLength === 0) {
                            if (currentTarget === undefined) {
                                currentTarget = clone();
                                parent.appendChild(currentTarget);
                            }
                            else {
                                parent.insertBefore(clone(), currentTarget);
                                currentTarget = currentTarget.previousElementSibling;
                            }
                            var data = createData(value[0], template.data);
                            data._item = value[0];
                            data._index = 0;
                            (function(){
                                var newTemplate = createTemplate(currentTarget, data, template.module, template);
                                templates[0] = newTemplate;
                                renderTarget(currentTarget, newTemplate, condition);
                            }());
                        }

                        while (i < newLength - 1) {
                            currentTarget.insertAdjacentElement("afterend", clone());
                            currentTarget = currentTarget.nextElementSibling;
                            (function(){
                                var j = i + 1;
                                var data = createData(value[j], template.data);
                                data._item = value[j];
                                data._index = j;
                                var newTemplate = createTemplate(currentTarget, data, template.module, template);
                                templates[j] = newTemplate;
                                renderTarget(currentTarget, newTemplate, condition);
                            }());
                            i++;
                        }
                    }());
                }
            }());
        }

        (function(){
            var i = 0;
            var next;
            currentTarget = target;
            while (i < (initialLength < newLength ? initialLength : newLength)) {
                if (value[i] === initial[i]) {
                    if (typeof value[i] === "object") {
                        recycleData(value[i], templates[i].data);
                    }
                    renderTarget(currentTarget, templates[i], condition);
                    currentTarget = currentTarget.nextElementSibling;
                    i++;
                    continue;
                }
                next = currentTarget.nextSibling;
                parent.removeChild(currentTarget);
                recurseComponent(template,"onremove");
                if (next === null) {
                    parent.appendChild(clone());
                    currentTarget = parent.children[parent.children.length - 1];
                }
                else {
                    parent.insertBefore(clone(), next);
                    currentTarget = next.previousElementSibling;
                }
                (function(){
                    var data = createData(value[i], template.data);
                    data._item = value[i];
                    data._index = i;
                    var newTemplate = createTemplate(currentTarget, data, template.module, template);
                    templates[i] = newTemplate;
                    renderTarget(currentTarget, newTemplate, condition);
                }());
                currentTarget = currentTarget.nextElementSibling;
                i++;
            }
        }());
        template.for.initial = value.map(function(x){
            return x;
        });
        return newLength;
    };

    const Options = function(options){
        if (options === undefined) {
            return;
        }
        var possibleOptions = [
            {
                name: "noIf",
                type: "bool"
            },
            {
                name: "noFor",
                type: "bool"
            },
            {
                name: "parent",
                type: "object"
            }
        ];
        Object.keys(options).forEach(function(key){
            var find = possibleOptions.filter(function(x){
                return x.name === key;
            });
            var output = options[key];
            if (find.length !== 1) {
                return;
            }
            if (options[key]) {
                this[key] = find[0].type === "bool"
                    ? !!output
                    : output;
            }
        }.bind(this));
    };

    var renderTextNode = function(target, template){
        var value = target.nodeValue;
        var newValue = debracer(template.value, template.data);
        if (value === newValue) {
            return;
        }
        target.nodeValue = newValue;
    };

    var renderTarget = function(target, template, condition, options){
        var name = template.name;
        var ifReturns;
        var forReturns;
        if (!(options instanceof Options)) {
            options = new Options();
        }
        if (condition === target) {
            condition = true;
        }
        if (name === "#comment" || name === "SCRIPT") {
            return 1;
        }
        if (name === "#text") {
            if (condition === true) {
                renderTextNode(target, template);
            }
            return 1;
        }
        if (condition === true) {
            if (!options.noIf && template.hasOwnProperty("if")) {
                ifReturns = renderIf(target, template);
                if (ifReturns === "added") {
                    (function(){
                        var childs = options && options.parent && options.parent.childNodes;
                        renderTarget(
                            target === undefined
                                ? childs[childs.length - 1]
                                : target.previousElementSibling,
                            template,
                            condition,
                            new Options({noIf: true})
                        );
                    }());
                    return 1;
                }
                if (ifReturns === 0) {
                    return ifReturns;
                }
            }
            if (!options.noFor && template.hasOwnProperty("for")) {
                forReturns = renderFor(target, template, condition);
                if (typeof forReturns ===  "number") {
                    return forReturns;
                }
            }
            renderAttributes(target, template);
        }
        (function(){
            var index = 0;
            forEach(template.children, function(_template, i){
                if (target === undefined) {
                    return;
                }
                var child = target.childNodes[index];
                var output = renderTarget(
                    child,
                    _template,
                    condition,
                    child === undefined
                        ? new Options({parent:target})
                        : undefined
                );
                index += output;
            });
        }());
        return 1;
    };

    var change = function(target){
        forEach(renders, function(template){
            renderTarget(template.target, template.template, target || true);
        });
    };

    var render = function(target, Data, dillModule){
        if (!(dillModule instanceof Module)) {
            throw new Error("You must pass a Dill Module instance.");
        }
        if (typeof Data !== "function") {
            throw new Error("You must pass a constructor function as the original Data.");
        }
        if (!(target instanceof Element)) {
            throw new Error("You must pass a HTML element as the target.");
        }
        var data = createData(new Data(), null);
        data.oninit && data.oninit();
        data._module = dillModule;
        var template = createTemplate(target, data, dillModule);

        // console.log("Template: ", template);

        renders.push({target: target, template: template});
        change();
        return data;
    };

    const reset = function(){
        renders.length = 0;
    };

    var clearRenders = function(){
        renders.length = 0;
    };

    var createComponent = function(name, data, template, isolateState, abstractConditions){
        return new Component(name, data, template, isolateState, abstractConditions);
    };

    var createService = function(name, data, isolateState){
        return new Service(name, data, isolateState);
    };

    window.dill = {
        render: render,
        change: change,
        clearRenders: clearRenders,
        component: createComponent,
        service: createService,
        reset: reset,
        module: function(name, modules){
            return new Module(name, modules);
        }
    };

}());
//# sourceMappingURL=dill.js.map
