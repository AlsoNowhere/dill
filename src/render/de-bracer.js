import { resolveData } from "../common/resolve-data";

export var deBracer = function(string,data){
// To do: Be able to escape braces if there is a preceding backslash(\). Remove the preceding backslash.
    return string.replace(/{[A-Za-z0-9_]+}/g,function(match){
        return resolveData(data,match.substring(1,match.length-1));
    });
}
