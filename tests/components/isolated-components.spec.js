
describe("isolated components",()=>{

	const Data = function(){};

	let context;
	let data;

	const definedValue = "Hello world";
	const exampleParentComponent = dill.component("parent",{},`<child></child>`);
	const exampleChildComponent = dill.component("child",{},definedValue,"isolate");

	const testModuleOne = dill.module("one");
	testModuleOne.setComponent(exampleParentComponent);
	testModuleOne.setComponent(exampleChildComponent);
	const testModuleTwo = dill.module("two",[testModuleOne]);

	beforeEach(()=>{
		document.body.innerHTML = `
			<div>
				<parent></parent>
			</div>
		`;
		context = document.body.children[0].children;
		dill.reset();
		
		data = dill.render(document.body,Data,testModuleTwo);
	});

	describe("when creating an isolated component on a module that is inherited into another module",()=>{
		it("should give the two components to the first module",()=>{
			expect(testModuleOne.components["parent"]).toBe(exampleParentComponent);
			expect(testModuleOne.components["child"]).toBe(exampleChildComponent);
		});

		it("should give the second module the parent component only",()=>{
			expect(testModuleTwo.components["parent"]).toBe(exampleParentComponent);
		});

		it("should not give the child component to the second module",()=>{
			expect(testModuleTwo.components["child"]).not.toBeDefined();
		});

		it("should not render the child component",()=>{
			expect(context[0].children[0].nodeName).toBe(exampleChildComponent.name.toUpperCase());
			expect(context[0].children[0].textContent).not.toBe(definedValue);
		});
	});

});
