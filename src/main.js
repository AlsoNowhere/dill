
import { render } from "./main/render";
import { change } from "./main/change";
import { reset } from "./main/reset";
import { dillModule } from "./classes/Module.class";
import { ComponentPrototype } from "./classes/ComponentPrototype.class";

var _dill = {
	render: render,
	change: change,
	module: dillModule,
	ComponentPrototype: ComponentPrototype,
	reset: reset
}

// OPTIONAL: Set dill to be on the window object. This allows the script to be added to the main HTML file and referenced globally.
window.dill = _dill;

// OPTIONAL: Add an export for module loaders. This allows the script to be consumed by an app being built so that the app can be bundled into a single JavaScript file.
// export var dill = _dill;
