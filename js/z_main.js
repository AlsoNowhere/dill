
"use strict";

(function(){

	var renders = [],
		ref = window._dill,
		Dill = function(){
			this.modules = {};
			this.module = function(name,modules){
				if (this.modules[name]) {
					return this.modules[name];
				}
				this.modules[name] = ref.create_module(name,this,modules===undefined?[]:modules);
				return this.modules[name];
			}
			this.render = function(a,b,c){
				var template,
					target,
					initial_data,
					module,
					set_root = function(){
						var _target = document.getElementById("dill-root");
						return _target === null ? document.body : _target;
					};

				target = a;
				initial_data = b;
				module = c;
				// if (arguments.length === 3) {
				// 	target = a;
				// 	initial_data = b;
				// 	module = c;
				// }
				// else if (arguments.length === 2) {
				// 	if (a instanceof HTMLElement) {
				// 		target = a;
				// 		if (b instanceof ref.Module) {
				// 			initial_data = {};
				// 			module = b;
				// 		}
				// 		else {
				// 			initial_data = b;
				// 			module = this.module();
				// 		}
				// 	}
				// 	else {
				// 		target = set_root();
				// 		initial_data = a;
				// 		module = b;
				// 	}
				// }
				// else if (arguments.length === 1) {
				// 	if (a instanceof HTMLElement) {
				// 		target = a;
				// 		initial_data = {};
				// 		module = this.module();
				// 	}
				// 	else if (a instanceof ref.Module) {
				// 		target = set_root();
				// 		initial_data = b;
				// 		module = a;
				// 	}
				// 	else if (
				// 		a.hasOwnProperty("target")
				// 		&& a.hasOwnProperty("initial_data")
				// 		&& a.hasOwnProperty("module")
				// 	) {
				// 		target = a.target;
				// 		initial_data = a.initial_data;
				// 		module = a.module;
				// 	}
				// 	else {
				// 		target = set_root();
				// 		initial_data = a;
				// 		module = this.module();
				// 	}
				// }
				template = ref.create_template(target,initial_data,module);
				ref.render_element(target,template);
				renders.push({target:target,template:template});
			}
			this.change = function(event){
				event && event();
				renders.forEach(function(x){
					ref.render_element(x.target,x.template);
				}.bind(this));
			};
			this.component = window._dill.generate_component;
			this.service = window._dill.generate_service;
			this.bubble_change = function(data,target,value){
				var recurser = function(data,target,value){
					if (data.hasOwnProperty(target)) {
						data[target] = value;
						return;
					}
					if (data.hasOwnProperty("_display")) {
						return recurser(data._display,target,value);
					}
				}
				recurser(data,target,value);
			}
		};

	window.dill = new Dill();
	delete window._dill;
}());
