
var baseForEach = function(initialIncrement, howToEndWhile, increment){
    return function(array, callback){
        var i = initialIncrement(array),
            result,
            newArray = [];
        while (howToEndWhile(i,array)) {
            result = callback(array[i], i);
            if (result === false) {
                break;
            }
            if (typeof result === "number") {
                i += result;
            }
            else {
                newArray.push(result);
            }
            i += increment;
        }
        return newArray;
    }
}

export var forEach = baseForEach(
    function(){
        return 0;
    },
    function(i, array){
        return i < array.length;
    },
    1
);

export var forReverseEach = baseForEach(
    function(array){
        return array.length - 1;
    },
    function(i){
        return i >= 0;
    },
    -1
);
