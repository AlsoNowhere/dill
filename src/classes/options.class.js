
export const Options = function(options){
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
}
