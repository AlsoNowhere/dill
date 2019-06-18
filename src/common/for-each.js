
export var forEach = function(scope, callback){
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
}

export var reverseForEach = function(scope, callback){
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
}
