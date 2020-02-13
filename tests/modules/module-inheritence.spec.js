
describe("module inheritence",()=>{

	let module1;
	let module2;

	const ExampleComponent = function(){};
	ExampleComponent.component = new dill.Component("example",``);

	describe("defining a component on one module and then inheriting that module on another module",()=>{
		beforeEach(()=>{
			module1 = dill.module("module1");
			module1.setComponent(ExampleComponent);
			module2 = dill.module("module2",[module1]);
		});

		it("should move components on first module to new module",()=>{
			expect(module2.components["example"].Component).toBe(ExampleComponent);
		});
	});

});
