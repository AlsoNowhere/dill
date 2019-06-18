
import { Service } from "../services/service.class";

export var setService = function(service){
	if (!(service instanceof Service)) {
		throw new Error("You can only set an instance of Dill Service as a service");
	}
	this.services [service.name] = service;
};
