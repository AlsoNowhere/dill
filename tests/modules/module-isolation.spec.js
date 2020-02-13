
describe("module isolation",()=>{

	let module1;
	let module2;

	const ExampleComponentOne = function(){};
	ExampleComponentOne.component = new dill.Component("one",``,true);

	const ExampleComponentTwo = function(){};
	ExampleComponentTwo.component = new dill.Component("one",``);

	describe("defining an isolated component on a module then inheriting that module on another module",()=>{
		beforeEach(()=>{
			module1 = dill.module("module1");
			module1.setComponent(ExampleComponentOne);
			module1.setComponent(ExampleComponentTwo);
			module2 = dill.module("module2",[module1]);
		});

		it("should give non isolated component to second module",()=>{
			expect(module2.components["one"]).toBeDefined();
		});

		it("should not give isolated component to second module",()=>{
			expect(module2.components["two"]).not.toBeDefined();
		});
	});
});
