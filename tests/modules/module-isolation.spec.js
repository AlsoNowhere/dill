
describe("module isolation",()=>{

	let module1;
	let module2;

	const ExampleComponentOne = dill.component("one",{},``,"isolate");
	const ExampleComponentTwo = dill.component("two",{},``);

	const ExampleServiceOne = dill.service("one",{},"isolate");
	const ExampleServiceTwo = dill.service("two",{});

	describe("defining an isolated component on a module then inheriting that module on another module",()=>{
		beforeEach(()=>{
			module1 = dill.module("module1");
			module1.setComponent(ExampleComponentOne);
			module1.setComponent(ExampleComponentTwo);
			module1.setService(ExampleServiceOne);
			module1.setService(ExampleServiceTwo);
			module2 = dill.module("module2",[module1]);
		});

		it("should not give isolated component to second module",()=>{
			expect(module2.components["one"]).not.toBeDefined();
		});

		it("should not give isolated service to second module",()=>{
			expect(module2.services["one"]).not.toBeDefined();
		});
	});

});
