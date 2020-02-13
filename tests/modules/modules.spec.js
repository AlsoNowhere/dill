
describe("modules | ",()=>{

	const Data = function(){}

	const tmodule = dill.module("tmodule");

	let context;
	let data;

	describe("define a module without a name",()=>{
		let tmodule;
		beforeEach(()=>{
			dill.reset();
			tmodule = dill.module("test");
		});

		it("should create a module",()=>{
			expect(tmodule).toBeDefined();
		});
	});

	describe("define a module with a name",()=>{
		const Component = function(){};
		Component.component = new dill.Component("example",``);

		let tmodule;

		beforeEach(()=>{
			dill.reset();
			tmodule = dill.module("tmodule");
			data = dill.create(tmodule,Data,document.body);
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
			it("should add a component when passing an instance of Component",()=>{
				tmodule.setComponent(Component);
				expect(tmodule.components["example"]).toBeDefined();
			});
		});
	});
});
