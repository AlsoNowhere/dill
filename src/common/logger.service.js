
var styles = function(colour1,colour2) {
    return "display: block;"
    +"width: 100%;"
    +"padding: 5px 7px;"
    +'background-color: ' + colour1 + ';'
    +'border: 2px solid ' + colour2 + ';'
    +"border-radius: 5px;"
    +"font-weight: bold;"
    +"color :white;"
    +"font-family: sans-serif;"
    +"line-height: 28px;"
    +"font-size: 18px;"
    +"text-align: center;";
}

var warnStyles = styles("orange","orange");
var errorStyles = styles("tomato","red");

var loggerBase = function(){
    return function(type,styles) {
        return function(functionName, message) {
            if (message === undefined) {
                message = functionName;
                functionName = null;
            }
            console.log("%c" + (functionName === null ? "" : (type + " at: " + functionName)),styles);
            console.log('%cMessage: ' + message, styles);
        }
    }
}();

export var logger = {
    warn: loggerBase("Warning",warnStyles),
    error: loggerBase("Error",errorStyles)
}
