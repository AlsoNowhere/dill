
// Create a new DillDynamicObject and use it to extend the model.

export var createData = function(data, parentData, isIsolated){

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
}
