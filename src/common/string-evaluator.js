
export var strEvaluator = function(str, data){
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
}
