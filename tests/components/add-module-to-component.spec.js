
describe("add module to component",()=>{

	const Data = function(){};

	let context;

	let componentScopeOne;
	let componentScopeTwo;

	const exampleComponentOne = dill.component("example-one",{
		oninit(){
			componentScopeOne = this;
		}
	},``);
	const exampleComponentTwo = dill.component("example-two",{
		oninit(){
			componentScopeTwo = this;
		}
	},``);

	const moduleOne = dill.module("one");
	moduleOne.setComponent(exampleComponentOne);
	const moduleTwo = dill.module("two");
	moduleTwo.setComponent(exampleComponentTwo);

	beforeEach(()=>{
		document.body.innerHTML = `
			<div>
				<example-one></example-one>
				<example-two></example-two>
			</div>
		`;
		context = document.body.children[0].children;
		dill.reset();
		dill.render(context[0],Data,moduleOne);
		dill.render(context[1],Data,moduleTwo);
	});

	describe("when rendering a component add the module reference to the component",()=>{
		it("should add a property to the component scope which is the relevant module",()=>{
			expect(componentScopeOne._module === moduleOne).toBe(true);
			expect(componentScopeOne._module === moduleTwo).toBe(false);
			expect(componentScopeTwo._module === moduleOne).toBe(false);
			expect(componentScopeTwo._module === moduleTwo).toBe(true);
		});
	});

});
