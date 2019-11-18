
export var lockObject = function(obj){
	Object.seal(obj);
	!!Object.freeze && Object.freeze(obj);
	return obj;
}
