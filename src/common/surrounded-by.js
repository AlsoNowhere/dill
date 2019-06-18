
export var isSurroundedBy = function(name, start, end){
	if (end === undefined) {
		end = start;
	}
	return name.substr(0,start.length) === start
		&& name.substr(name.length - end.length, name.length) === end;
}
