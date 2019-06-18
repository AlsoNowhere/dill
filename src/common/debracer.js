
import { forEach } from "./for-each";
import { strEvaluator } from "./string-evaluator";

export var debracer = function(str, data){
	var strParts = str.split("{{");
	forEach(strParts, function(each, index){
		var end = each.indexOf("}}");
		strParts[index] = end === -1
			? each
			: strEvaluator(each.substring(0, end), data) + each.substring(end + 2, each.length);
	});
	return strParts.join("");
}
