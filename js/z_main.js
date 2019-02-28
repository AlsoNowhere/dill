
"use strict";

(function(){

	var renders = [],
		ref = window._dill,
		Dill = function(){
			this.modules = {};
			this.module = function(name,modules){
				if (!this.modules[name]) {
					this.modules[name] = ref.create_module(name,this,modules===undefined?[]:modules);
				}
				return this.modules[name];
			}
			this.render = function(target,initial_data,module,finish){
				var _in = initial_data;
				var template,
					set_root = function(){
						var _target = document.getElementById("dill-root");
						return _target === null
							? document.body
							: _target;
					};
				initial_data = ref.create_data_object({template_object:initial_data});

				initial_data.oninit && initial_data.oninit();

				template = ref.create_template(target,initial_data,module);

				// console.log("Initial data: ", initial_data, template);

				ref.render_element(target,template);
				// renders.push({target:target,template:template});
				renders[0] = {target:target,template:template};
				return template.data;
				// finish && finish.apply(template.data,[template.data]);
				// return new Promise(function(resolve){
				// 	resolve();
				// });
			}
			this.change = function(event){
				event && event();
				renders.forEach(function(x){
					ref.render_element(x.target,x.template);
				}.bind(this));
			};
			this.component = window._dill.generate_component;
			this.service = window._dill.generate_service;
		};

	window.dill = new Dill();
	delete window._dill;
}());
