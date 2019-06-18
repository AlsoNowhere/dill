
export var createData = function(data, prototype, type){
	var Data = function(){
		for (var item in data) {
			(function(){
				var _value;
				Object.defineProperty(this, item, {
					get: function(){
						return _value;
					},
					set: function(value){
						_value = value;
					}
				});
				this[item] = data[item];
			}.apply(this));
		}
		if (prototype !== null && type === undefined) {
			this._parent = prototype;
		}
	};
	if (prototype !== null && type === undefined) {
		Data.prototype = prototype;
	}
	return new Data();
}
