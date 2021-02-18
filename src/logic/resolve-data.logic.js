
export var resolveData = (data, value) => {
    var output = data[value] instanceof Function
        && data[value].component === undefined
            ? data[value]()
            : data[value];
    return output === undefined
        ? ""
        : output;
}
