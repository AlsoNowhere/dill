
describe("get template",()=>{

	const Data = function(){}

	let componentScope;

	const ExampleComponent = dill.component("example",{
		oninit(){
			componentScope = this;
		}
	},``);

	let context;
	let data;

	const value = "test";

	beforeEach(()=>{
		document.body.innerHTML = `
			<div>
				<example>${value}</example>
			</div>
		`;
		context = document.body.children[0].children;
		dill.reset();
		const dmodule = dill.module();
		dmodule.setComponent(ExampleComponent);
		data = dill.render(document.body,Data,dmodule);
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
