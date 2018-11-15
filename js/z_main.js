
"use strict";

(function(){

	var renders = [],
		ref = window._dill,
		Dill = function(){
			this.modules = {};
			this.module = function(name,modules){
				this.modules[name] = ref.create_module(name,modules===undefined?[]:modules);
				return this.modules[name];
			}
			this.render = function(target,initial_data,module){
				var template;
				if (module === undefined) {
					module = this.module();
				}
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
