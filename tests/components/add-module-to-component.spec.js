
describe("add module to component",()=>{

	let context;

	let componentScopeOne;
	let componentScopeTwo;

	const ExampleComponentOne = function(){
		this.oninit = function(){
			componentScopeOne = this;
		}
	};
	ExampleComponentOne.component = new dill.Component("example-one",'');

	const ExampleComponentTwo = function(){
		this.oninit = function(){
			componentScopeTwo = this;
		}
	};
	ExampleComponentTwo.component = new dill.Component("example-two",'');

	const moduleOne = dill.module("one");
	const moduleTwo = dill.module("two");

	moduleOne.setComponent(ExampleComponentOne);
	moduleTwo.setComponent(ExampleComponentTwo);

	beforeEach(()=>{
		document.body.innerHTML = `
			<div>
				<example-one></example-one>
				<example-two></example-two>
			</div>
		`;
		context = document.body.children[0].children;
		dill.reset();
		dill.create(moduleOne,function(){},context[0]);
		dill.create(moduleTwo,function(){},context[1]);
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
