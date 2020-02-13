
export var defineProperty = function(obj,key,initialValue){
    var _value = initialValue;
    Object.defineProperty(obj,key,{
        get: function(){
            return _value;
        },
        set: function(value){
            _value = value;
        },
// Setting this to true (default is false) means that this property can be removed.
        configurable: true
    });
}
