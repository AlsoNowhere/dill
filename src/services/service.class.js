
import { lockObject } from "../common/lock-object";

export var Service = function(name, data, isolateState){
	this.name = name;
	this.data = typeof data === "function"
		? new data()
		: data;
	this.isIsolated = isolateState === "isolate";
	lockObject(this);
};
