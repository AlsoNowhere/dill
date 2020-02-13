
describe("isolated components",()=>{

	let context;

	const definedValue = `Hello world`;

	const ExampleParentComponent = function(){};
	ExampleParentComponent.component = new dill.Component("parent",`<child></child>`);

	const ExampleChildComponent = function(){};
	ExampleChildComponent.component = new dill.Component("child",definedValue,true);

	const testModuleOne = dill.module("one");
	testModuleOne.setComponent(ExampleParentComponent);
	testModuleOne.setComponent(ExampleChildComponent);

	const testModuleTwo = dill.module("two",[testModuleOne]);

	beforeEach(()=>{
		document.body.innerHTML = `
			<div>
				<parent></parent>
			</div>
		`;
		context = document.body.children[0].children[0];
		dill.reset();
		dill.create(testModuleTwo,function(){},context);
	});

	describe("when creating an isolated component on a module that is inherited into another module",()=>{
		it("should give the two components to the first module",()=>{
			expect(testModuleOne.components["parent"].Component).toBe(ExampleParentComponent);
			expect(testModuleOne.components["child"].Component).toBe(ExampleChildComponent);
		});

		it("should give the second module the parent component only",()=>{
			expect(testModuleTwo.components["parent"].Component).toBe(ExampleParentComponent);
		});

		it("should not give the child component to the second module",()=>{
			expect(testModuleTwo.components["child"]).not.toBeDefined();
		});

		it("should not render the child component",()=>{
			expect(context.children[0].nodeName).toBe(ExampleChildComponent.component.name.toUpperCase());
			expect(context.children[0].textContent).not.toBe(definedValue);
		});
	});

});
