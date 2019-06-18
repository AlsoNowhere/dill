
import { Service } from "./service.class";

export var createService = function(name, data, isolateState){
	return new Service(name, data, isolateState);
}
