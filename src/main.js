
import { render } from "./main/render";
import { change } from "./main/change";
import { reset } from "./main/reset";
import { clearRenders } from "./main/clear-renders";
import { Module } from "./classes/module.class";
import { createComponent } from "./components/create-component";
import { createService } from "./services/create-service";

window.dill = {
	render: render,
	change: change,
	clearRenders: clearRenders,
	component: createComponent,
	service: createService,
	reset: reset,
	module: function(name, modules){
		return new Module(name, modules);
	}
}
