
describe("dill component - basic | ",()=>{

	const run = jasmine.createSpy();

	const Data = function(){
		this.parent = "One";
	}

	const componentData = {
		oninit(){
			run();
		},
		component: "Two"
	};

	const ExampleComponent = dill.component("example",componentData,`
		<p>Test: {{component}}</p>
	`);

	let context;
	let data;

	beforeEach(()=>{
		document.body.innerHTML = `
			<div>
				<example></example>
			</div>
		`;
		context = document.body.children[0].children;
		dill.reset();
		const dmodule = dill.module("dmodule");
		dmodule.setComponent(ExampleComponent);
		data = dill.render(document.body,Data,dmodule);
	});

	it("should render the component",()=>{
		expect(context[0].children.length).toBe(1);
	});

	it("should render the content correctly",()=>{
		expect(context[0].children[0].textContent).toBe(`Test: ${componentData.component}`);
	});

	it("should run oninit",()=>{
		expect(run).toHaveBeenCalled();
	});

});
