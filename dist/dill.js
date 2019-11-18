(function () {
    'use strict';

    var logger = {
        error: function(message){
            console.log(
                "%c " + message
                + "%c " + "- Generated from logger service",
                "color:red;",
                "color:grey;"
            );
        },
        warn: function(message) {
            console.warn(message);
        }
    };

    var ComponentPrototype = function(name,template,module){
        if (typeof name !== "string") {
            logger.error("You must pass a string as the name of the component.");
            throw new Error("You must pass a string as the name of the component.");
        }
        
        if (name.indexOf("\n") > -1) {
            logger.error("You can not put line breaks in the component name.");
            throw new Error("You can not put line breaks in the component name.");
        }

        if (typeof template !== "string") {
            logger.error("You must pass a string as the template of the component.");
            throw new Error("You must pass a string as the template of the component.");
        }

        if (!!module && !(module instanceof Module)) {
            logger.error("You must pass an instance of Module for the module, or leave undefined.");
            throw new Error("You must pass an instance of Module for the module, or leave undefined.");
        }

        this.name = name;
        this.template = template;
    };

    var setComponent = function(component){

    	if (!(component instanceof Function)) {
    		logger.error("You must pass a constructor function to the .setComponent method on a dill module.");
    		throw new Error("You must pass a constructor function to the .setComponent method on a dill module.");
    	}

    	if (!(component.prototype instanceof ComponentPrototype)) {
    		logger.error("You must use an instance of ComponentPrototype for the constructor function prototype.");
    		throw new Error("You must use an instance of ComponentPrototype for the constructor function prototype.");
    	}

    	this.components[component.prototype.name] = component;
    };

    var lockObject = function(obj){
    	Object.seal(obj);
    	!!Object.freeze && Object.freeze(obj);
    	return obj;
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

    var Module$1 = function(){
    	var Module = function(name, modules){
    		var currentModule = this;

    		if (modules === undefined) {
    			modules = [];
    		}

    		modules = modules.filter(function(x){
    			return x instanceof Module;
    		});

    		this.name = name;
    		this.components = {};
    		this.services = {};

    		forEach(modules,function(eachModule){
    			if (!(eachModule instanceof Module)) {
    				return;
    			}

    			Object.keys(eachModule.components).forEach(function(key){
    				var component = eachModule.components[key];
    				if (component.isIsolated) {
    					return;
    				}
    				currentModule.components[key] = component;
    			});
    		});
    		lockObject(this);
    	};
    	Module.prototype = {
    		setComponent: setComponent
    	};
    	return Module;
    }();

    var dillModule = function(name, modules){

    	if (typeof name !== "string") {
            logger.error("You must pass a string as the name of the module.");
            throw new Error("You must pass a string as the name of the module.");
    	}
    	
    	if (!!modules && !(modules instanceof Array)) {
    		logger.error("You must pass an Array or undefined for the modules argument of the module.");
    		throw new Error("You must pass an Array or undefined for the modules argument of the module.");
    	}

    	return new Module$1(name, modules);
    };

    var Render = function(
        targetElement,
        dillTemplate
    ){
        this.targetElement = targetElement;
        this.dillTemplate = dillTemplate;
    };

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
    		// 	target.setAttribute(name, value);
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

    // Create a new DillDynamicObject and use it to extend the model.

    var createData = function(data, parentData, isIsolated){

    // Define a new construcutor function that will only be accessible once.
    // Something to consider is that a constructor function is made
    // (and it has to be named for two reasons, to get the name of the instance to aid debugging and to be able to add a prototype)
    // then it is immediately called onjly once.
    // Every model object has the same name which means a developer can be tricked into testing for instanceof for a constructor function with the same name but it is not the same one.
    	var DillDynamicObject = function(){

    // The syntax for in checks an objects properties and then looks up the prototype chain unless the object on the chain is an instance of Object.
    // This is intentionally used here to provide a powerful way to create a new model object.
    // This best use case for this is for libraries.
    		for (var item in data) {

    // Add a closure around the property definition because JavaScript ES5 does not have block scope around the for loop but it does have function scope.
    			(function(){

    // Define a new variable that is private (in the sense that it can only be seen inside this function and the developer cannot get their mits on it).
    				var _value = data[item];

    // Using a getter setter pattern means that the prototype chain in JavaScript behaves like variables in functional scopes (which is not the default way).
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

    // You can isolate a model to prevent look ups further up the prototype chain. This means that a developer can write a component and it can be self contained.
    // This means that libraries can be written safely.
    		if (parentData !== null && !isIsolated) {

    // Expose the parent on the model for manual lookups up the chain. This does not need to be exposed for Dill to work but good developers know that sometimes you just need a good hammer.
    			this._parent = parentData;
    		}
    	};
    	if (parentData !== null && !isIsolated) {

    // Add the parent data on to the model prototype. This means the model is being extended.
    // This pattern of implied lookups framework feature has a very slippery slope in the sense of confusing a developer. Dill has to be written carefully to prevent confusion.
    // Doing this pattern means that the file size overhead is greatly reduced and the speed of development is increased.
    // The lookups are confusing but are alos less confusing in the sense that they are less verbose.
    		DillDynamicObject.prototype = parentData;
    	}
    	return new DillDynamicObject();
    };

    var isSurroundedBy = function(name, start, end){
    	if (end === undefined) {
    		end = start;
    	}
    	return name.substr(0,start.length) === start
    		&& name.substr(name.length - end.length, name.length) === end;
    };

    const DillComponent = function(component){
        const proto = component.prototype;

        this.name = proto.name;
        this.template = proto.template;
        if (!!proto.module) {
            this._module = proto.module;
        }

        component.prototype = {};

        this.baseData = new component();
    };

    var DillTemplate = function(
    	targetElement,
    	initialDillDataModel,
    	dillModule,
    	templateParent
    ){
    	this.name = targetElement.nodeName;
    	this.module = dillModule;

    	if (!!templateParent) {
    		this.templateParent = templateParent;
    	}

    	if (this.name === "#text") {
    		this.value = targetElement.nodeValue;
    		this.data = initialDillDataModel;
    		return lockObject(this);
    	}

    	this.children = [];

    	var component = dillModule.components[this.name.toLowerCase()],
    		componentIsValid = true;

    	if (!!component) {
    		component = new DillComponent(component);
    	}

    	// console.log("Component: ", component);

    	// var checkParentTemplates = function(parent,condition){
    	// 	if (!parent.templateParent) {
    	// 		return;
    	// 	}
    	// 	if (parent.component === condition) {
    	// 		componentIsValid = true;
    	// 		return;
    	// 	}
    	// 	checkParentTemplates(parent.templateParent,condition);
    	// }

    	// if (!!component && !!component.abstractConditions) {
    	// 	componentIsValid = false;
    	// 	forEach(component.abstractConditions,function(condition){
    	// 		if (componentIsValid) {
    	// 			return false;
    	// 		}
    	// 		checkParentTemplates(this,condition);
    	// 	}.bind(this));
    	// }

    	if (component !== undefined && componentIsValid) {
    		this.component = component;
    		if (targetElement.hasAttribute("dill-for")) {
    			this.data = initialDillDataModel;
    			return;
    		}

    		this.data = createData(
    			component.baseData,
    			initialDillDataModel,
    			!!targetElement.hasAttribute("dill-isolate")
    		);

    		targetElement.removeAttribute("dill-isolate");

    		forEach(targetElement.attributes,function(attribute){
    			var name = attribute.nodeName,
    				value = attribute.nodeValue,
    				prop;
    			if (isSurroundedBy(name,"[","]")) {
    				prop = name.substring(1,name.length-1);
    				Object.defineProperty(this.data,prop,{
    					get: function(){
    						return initialDillDataModel[value];
    					},
    					set: function(setValue){
    						initialDillDataModel[value] = setValue;
    					}
    				});
    			}
    			else {
    				this.data[name] = isSurroundedBy(value,"'")
    					? value.substring(1,value.length-1)
    					: initialDillDataModel[value];
    			}
    		}.bind(this));

    		return;
    	}

    	this.attributes = [];
    	this.data = initialDillDataModel;
    };

    var isBinding = function(str){
    	return str.substr(0, 1) === ":";
    };

    var isEvent = function(str){
    	return str.substr(str.length - 1, 1) === ":";
    };

    var attributeType = function(attribute){
    	var name = attribute.nodeName;
    	if (isSurroundedBy(name, "[", "]") || isBinding(name)) {
    		return "bind";
    	}
    	if (isSurroundedBy(name, "(", ")") || isEvent(name)) {
    		return "event";
    	}
    	return "default";
    };

    var AttributeTemplate = function(
    	target,
    	template,
    	attribute
    ){

    	this.name = attribute.nodeName;
    	var value = attribute.nodeValue,
    		parsed;

    	if (this.name.substr(0, 1) === "#") {
    // This is a set to and not an Object.defineProperty because it is up to the user to define a property where they deem is appropriate.
    // If the user defines the property it will be a getter setter, if they do not it will be a static property and will stay at the scope level.
    		template.data[this.name.substring(1)] = target;
    		this.type = "hashReference";
    		return;
    	}

    	parsed = isBinding(this.name)
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

    	value = this.value;

    	if (this.type === "event") {

    		var eventProperty = template.data[value];

    		if (!(eventProperty instanceof Function)) {
    			logger.warn("Event " + this.parsed + " property is not a function, nothing will be run.");
    		}

    		target.addEventListener(this.parsed, function(event){
    			if (eventProperty === undefined) {
    				return;
    			}
    			var output = eventProperty.apply(template.data, [event, this]);
    			output !== false && dill.change();
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

    var createDillTemplate = function(
    	targetElement,
    	initialDillDataModel,
    	dillModule,
    	templateParent
    ){
    	var newDillTemplate = new DillTemplate(
    		targetElement,
    		initialDillDataModel,
    		dillModule,
    		templateParent
    	);

    	var dillDataModel = newDillTemplate.data;

    	if (newDillTemplate.name === "SCRIPT" || (targetElement.hasAttribute instanceof Function && targetElement.hasAttribute("dill-ignore"))) {
    		return newDillTemplate;
    	}

    	if (!!newDillTemplate.component && dillDataModel.hasOwnProperty("onprerender")) {
    		dillDataModel.onprerender();
    	}

    	!!targetElement.attributes
    		&& targetElement.attributes["dill-extends"]
    		&& !!dillExtends
    		&&  (function(){
    			dillExtends(targetElement, newDillTemplate);
    		}());

    	!!targetElement.attributes
    		&& targetElement.attributes["dill-if"]
    		&& !!dillIf
    		&& dillIf(targetElement, newDillTemplate);

    	!!targetElement.attributes
    		&& reverseForEach(targetElement.attributes, function(attribute){
    			if (!newDillTemplate.if && attribute.nodeName === "dill-template") {
    				return;
    			}
    			if (!newDillTemplate.if && attribute.nodeName === "dill-for" && !!dillFor) {
    				return dillFor(targetElement, newDillTemplate);
    			}
    			!newDillTemplate.component
    				&& newDillTemplate.attributes.push(
    					new AttributeTemplate(targetElement, newDillTemplate, attribute)
    				);
    		});

    	!!newDillTemplate.attributes
    		&& reverseForEach(newDillTemplate.attributes, function cleanUpAttributes(attribute, index){
    			if (attribute.type === "event" || attribute.type === "hashReference") {
    				newDillTemplate.attributes.splice(index, 1);
    			}
    			if (attribute.type !== "default") {
    				targetElement.removeAttribute(attribute.name);
    			}
    		});

    	if (!!newDillTemplate.if && newDillTemplate.if.first === false) {
    		return newDillTemplate;
    	}

    	targetElement.attributes
    		&& targetElement.attributes["dill-template"]
    		&& !!dillTemplate
    		&& dillTemplate(targetElement, newDillTemplate);

    	!!newDillTemplate.component && (function(){
    		var recursiveComponentElements;
    		if (!(newDillTemplate.for ? !newDillTemplate.for.first : !newDillTemplate.for)) {
    			return;
    		}
    		dillDataModel._template = targetElement.innerHTML;
    		targetElement.innerHTML = newDillTemplate.component.template;
    		recursiveComponentElements = targetElement.getElementsByTagName(newDillTemplate.component.name.toUpperCase());
    		forEach(recursiveComponentElements,function(element){
    			var hasConditional = false,
    				currentElement = element;
    			while (currentElement !== targetElement && !hasConditional) {
    				hasConditional = currentElement.hasAttribute("dill-if");
    				currentElement = currentElement.parentNode;
    			}
    			if (!hasConditional) {
    				logger.error("Recursive element detected without conditional catch. To avoid infinite loop render was stopped.");
    				throw new Error("Recursive element detected without conditional catch. To avoid infinite loop render was stopped.");
    			}
    		});
    	}());
    	
    	if (
    		newDillTemplate.for
    			? !newDillTemplate.for.first
    			: !newDillTemplate.for
    	) {
    		targetElement.childNodes
    			&& forEach(targetElement.childNodes, function generateChildTemplates(child){
    				newDillTemplate.children.push(createDillTemplate(child, dillDataModel, dillModule, newDillTemplate));
    			});
    	}

    	if (newDillTemplate.for) {
    		newDillTemplate.for.first = false;
    	}

    	if (!!newDillTemplate.component && dillDataModel.hasOwnProperty("oninit")) {
    		dillDataModel.oninit();
    	}

    	return newDillTemplate;
    };

    // var recurseComponent = function(template,type){
    // 	if (template.component.hasOwnProperty(type) && typeof template.component[type] === "function") {
    // 		template.component[type]();
    // 	}
    // 	forEach(template.childs,function(x){
    // 		recurseComponent(x,type);
    // 	});
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
    				// var newTemplate = createTemplate(template.if.target, template.data, template.data._module, template);
    				// template.attributes = newTemplate.attributes;
    				// template.children = newTemplate.children;








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
    						template.children.push(createDillTemplate(child, template.data, template.data._module, template));
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
    		// 	template.data.onadd && template.data.onadd();
    		// }


    		return "added";
    	}
    	else if (oldState === true && newState === false) {
    		parent.removeChild(template.if.target);
    		// if (template.component) {
    		// 	template.data.onremove && template.data.onremove();
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
    		logger.error("Count not find " + template.for.value + " on current scope.");
    		throw new Error("Count not find " + template.for.value + " on current scope.");
    	}
    	else if (!(value instanceof Array)) {
    		logger.error("This property: " + template.for.value + " is not an Array and therefore not iterable in a dill-for");
    		throw new Error("This property: " + template.for.value + " is not an Array and therefore not iterable in a dill-for");
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
    							var newTemplate = createDillTemplate(currentTarget, data, template.module, template);
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
    							var newTemplate = createDillTemplate(currentTarget, data, template.module, template);
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
    				var newTemplate = createDillTemplate(currentTarget, data, template.module, template);
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

    var renderTextNode = function(
    	targetElement,
    	dillTemplate
    ){
    	var value = targetElement.nodeValue,
    		newValue = debracer(dillTemplate.value, dillTemplate.data);

    	if (value === newValue) {
    		return;
    	}

    	targetElement.nodeValue = newValue;
    };

    // The condition argument is OPTIONAL and can either be a HTML element or a component constructor function.
    var renderTarget = function(
    	targetElement,
    	dillTemplate,
    	condition,
    	options
    ){
    	var name = dillTemplate.name,
    		ifReturns,
    		forReturns,
    		conditionIsMet = typeof condition === "boolean"
    			? condition
    			: false,
    		makeConditionTrue = function(){
    			condition = true;
    			conditionIsMet = true;
    		};

    	if (!(options instanceof Options)) {
    		options = new Options();
    	}

    // In order to render this element and its child nodes the condition must be -> true
    // If the condition is not true then it will become true if the condition matches the element passed into the render
    // OR if the current component (stored on the dill template) is the current condition.
    	if (typeof condition !== "boolean") {
    		if (condition instanceof Element && condition === targetElement) {
    			makeConditionTrue();
    		}
    		else if (
    			!(condition instanceof Element)
    				&& condition instanceof Object
    				&& dillTemplate.component instanceof DillComponent
    				&& dillTemplate.component.baseData instanceof condition
    		) {
    			makeConditionTrue();
    		}
    	}

    	if (name === "#comment" || name === "SCRIPT") {
    		return 1;
    	}

    	if (name === "#text") {
    		if (conditionIsMet === true) {
    			renderTextNode(targetElement, dillTemplate);
    		}
    		return 1;
    	}

    	if (conditionIsMet === true) {
    		if (!options.noIf && dillTemplate.hasOwnProperty("if")) {
    			ifReturns = renderIf(targetElement, dillTemplate);
    			if (ifReturns === "added") {
    				(function(){
    					var childs = options
    						&& options.parent
    						&& options.parent.childNodes;
    					renderTarget(
    						targetElement === undefined
    							? childs[childs.length - 1]
    							: targetElement.previousElementSibling,
    						dillTemplate,
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

    		if (!options.noFor && dillTemplate.hasOwnProperty("for")) {
    			forReturns = renderFor(targetElement, dillTemplate, condition);
    			if (typeof forReturns ===  "number") {
    				return forReturns;
    			}
    		}

    		renderAttributes(targetElement, dillTemplate);
    	}

    	(function(){
    		var index = 0;
    		forEach(dillTemplate.children, function(_template, i){
    			if (targetElement === undefined) {
    				return;
    			}
    			var child = targetElement.childNodes[index];
    			var output = renderTarget(
    				child,
    				_template,
    				condition,
    				child === undefined
    					? new Options({parent:targetElement})
    					: undefined
    			);
    			index += output;
    		});
    	}());

    	return 1;
    };

    var change = function(targetElement){
    	forEach(renders, function(render){
    		if (!(render instanceof Render)) {
    			return;
    		}
    		renderTarget(
    			render.targetElement,
    			render.dillTemplate,
    			targetElement || true
    		);
    	});
    };

    var render = function(
    	targetElement,
    	InitialDataConstructor,
    	dillModule
    ){

    	if (!(dillModule instanceof Module$1)) {
    		logger.error("You must pass a Dill Module instance.");
    		throw new Error("You must pass a Dill Module instance.");
    	}

    	if (typeof InitialDataConstructor !== "function") {
    		logger.error("You must pass a constructor function as the original Data.");
    		throw new Error("You must pass a constructor function as the original Data.");
    	}

    	if (!(targetElement instanceof Element)) {
    		logger.error("You must pass a HTML element as the target.");
    		throw new Error("You must pass a HTML element as the target.");
    	}

    	var data = createData(new InitialDataConstructor(), null);

    // Expose the Dill Module on the model. This allows the developer to access the current Dill Module without having to pass it through by other means.
    	data._module = dillModule;

    // Begin templating the root element.
    	var dillTemplate = createDillTemplate(targetElement, data, dillModule);

    // OnInit lifecycle method. This runs after templating the root element.
    	data.oninit && data.oninit();

    	renders.push(
    		new Render(targetElement, dillTemplate)
    	);

    // This function runs the whole dill operation.
    	change();

    	return data;
    };

    const reset = function(){
    	renders.length = 0;
    };

    var _dill = {
    	render: render,
    	change: change,
    	module: dillModule,
    	ComponentPrototype: ComponentPrototype,
    	reset: reset
    };

    // OPTIONAL: Set dill to be on the window object. This allows the script to be added to the main HTML file and referenced globally.
    window.dill = _dill;

    // OPTIONAL: Add an export for module loaders. This allows the script to be consumed by an app being built so that the app can be bundled into a single JavaScript file.
    // export var dill = _dill;

}());
//# sourceMappingURL=dill.js.map
