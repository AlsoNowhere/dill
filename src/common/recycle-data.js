
export var recycleData = function(newData, oldData){
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
}
