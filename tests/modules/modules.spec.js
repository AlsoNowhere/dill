
describe("modules | ",()=>{

	const Data = function(){
		
	}

	const tmodule = dill.module("tmodule");

	let context;
	let data;

	describe("define a module without a name",()=>{
		let tmodule;
		beforeEach(()=>{
			dill.reset();
			tmodule = dill.module();
		});

		it("should create a module",()=>{
			expect(tmodule).toBeDefined();
		});
	});

	describe("define a module with a name",()=>{
		const component = dill.component("example",{},``);
		const service = dill.service("example",{});

		let tmodule;

		beforeEach(()=>{
			dill.reset();
			tmodule = dill.module("tmodule");
			data = dill.render(document.body,Data,tmodule);
		});

		it("should create a module",()=>{
			expect(tmodule).toBeDefined();
		});

		describe("use module to define new render",()=>{
			it("should add the module to the top level scope",()=>{
				expect(data._module).toBeDefined();
				expect(data._module).toBe(tmodule);
			});
		});

		describe("using setComponent",()=>{
			it("should reject a non component",()=>{
				expect(function(){
					tmodule.setComponent({})
				}).toThrow(new Error("You can only set an instance of Dill Component as a component"));
				expect(function(){
					tmodule.setComponent(service)
				}).toThrow(new Error("You can only set an instance of Dill Component as a component"));
			});

			it("should add a component when passing an instance of Component",()=>{
				tmodule.setComponent(component);
				expect(tmodule.components["example"]).toBeDefined();
			});
		});

		describe("using setService",()=>{
			it("should reject a non service",()=>{
				expect(function(){
					tmodule.setService({})
			}).toThrow(new Error("You can only set an instance of Dill Service as a service"));
				expect(function(){
					tmodule.setService(component)
				}).toThrow(new Error("You can only set an instance of Dill Service as a service"));
			});

			it("should add a service when passing an instance of Service",()=>{
				tmodule.setService(service);
				expect(tmodule.services["example"]).toBeDefined();
			});
		});
	});

});
