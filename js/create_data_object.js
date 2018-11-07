
"use strict";

(function(){
	window._dill.create_data_object = function(template_object,parent_data,index){
		var Data = function(template){
			Object.keys(template).forEach((function(key){
				this[key] = template[key];
			}).bind(this));
			if (index !== undefined) {
				this._item = template;
				this._index = index;
			}
			this._display = parent_data;
		}
		Data.prototype = parent_data;
		return new Data(template_object);
	}
}());
