
describe("generate component data",()=>{

	let componentScope;

	const value = "goose";

	const ExampleComponent = function(){
		this.oninit = function(){
			componentScope = this;
		}
    }
    ExampleComponent.prototype = new function(){
        this.loop = value;
    }
	ExampleComponent.component = new dill.Component("example",``);

	let context;

	beforeEach(()=>{
		document.body.innerHTML = `
			<div>
				<example></example>
			</div>
		`;
		context = document.body.children[0].children[0];
		dill.reset();
		const dmodule = dill.module("test");
		dmodule.setComponent(ExampleComponent);
		dill.create(dmodule,function(){},context);
	});

	describe("when component data has a prototype",()=>{
		it("should add those values on to the created data component scope",()=>{
			expect(componentScope.loop).toBe(value);
		});
	});
});
