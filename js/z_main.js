
"use strict";

(function(){

	var renders = [];
	var _ref = window._dill;

	window._dill.components = {};
	window._dill.services = {};
	window._dill.elements = {};

	var Dill = function(){
		this.render = function(ele,data){
			var template = this.create_template(ele,data);
			renders.push({ele:ele,data:data,template:template});
			this.render_element({ele:ele,template:template,data:data});
		};
		this.change = function(event){
			event && event();
			_ref.elements = {};
			renders.forEach((function(x){
				this.render_element({ele:x.ele,template:x.template,data:x.data});
			}).bind(this));
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

	Dill.prototype = window._dill;
	window.dill = new Dill();
	delete window._dill;
}());
