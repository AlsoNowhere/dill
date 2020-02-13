
export var isSurroundedBy = function(value, start, end){
    if (end === undefined) {
        end = start;
    }
    return value.substr(0,start.length) === start && value.substr(value.length - end.lenth,end.length);
}
