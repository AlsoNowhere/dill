
export var resolveData = function(data,value){
    var output = data[value] instanceof Function
        ? data[value]()
        : data[value];
    return output === undefined ? "" : output;
}
