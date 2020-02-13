
import { dillModule } from "./module/module";
import { create } from "./create/create";
import { change } from "./change/change";
import { Component } from "./component/component";
import { reset } from "./reset/reset";

var Dill = function(){
	this.module = dillModule;
	this.create = create;
	this.change = change;
	this.Component = Component;
	this.reset = reset;
}

// CJS | mode
// export var dill = new Dill();

// script src | mode
window.dill = new Dill();
