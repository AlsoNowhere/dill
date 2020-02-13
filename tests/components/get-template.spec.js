
describe("get template",()=>{

	let componentScope;

	const value = "test";

	const ExampleComponent = function(){
		this.oninit = function(){
			componentScope = this;
		}
	}
	ExampleComponent.component = new dill.Component("example",``);

	let context;


	beforeEach(()=>{
		document.body.innerHTML = `
			<div>
				<example>${value}</example>
			</div>
		`;
		context = document.body.children[0].children[0];
		dill.reset();
		const dmodule = dill.module("test");
		dmodule.setComponent(ExampleComponent);
		dill.create(dmodule,function(){},context);
	});

	describe("when a component is defined on the page",()=>{
		it("should add a _template property to the component scope that is the previous innerHTML",done=>{
			setTimeout(()=>{
				expect(componentScope._template).toBe(value);
				done();
			},0);
		});
	});

});
