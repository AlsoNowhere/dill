
describe("dill component - basic | ",()=>{

	const change = {run(){}};

	const Data = function(){
		this.parent = "One";
	}

	const componentData = {
		component: "Two"
	};

	const ExampleComponent = function(){
		this.oninit = () => change.run();
		this.component = componentData.component;
	};
	ExampleComponent.component = new dill.Component("example",`
		<p>Test: {component}</p>
	`);

	let context;

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
		spyOn(change,"run");
		dill.create(dmodule,Data,context[0]);
	});

	it("should render the component",()=>{
		expect(context[0].children.length).toBe(1);
	});

	it("should render the content correctly",()=>{
		expect(context[0].children[0].textContent).toBe(`Test: ${componentData.component}`);
	});

	it("should run oninit",()=>{
		expect(change.run).toHaveBeenCalled();
	});
});
