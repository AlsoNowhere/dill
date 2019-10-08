
export var createData = function(data, prototype, type){
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
}
