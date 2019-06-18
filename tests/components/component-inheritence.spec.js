
describe("dill component - inheritence | ",()=>{

	const Data = function(){
		this.parent = "One";
		this.value = "One";
	}

	const componentData = {
		component: "Two",
		update(){
			this.value = newValue;
		}
	};

	const newValue = "Two";

	const ExampleComponent = dill.component("example",componentData,`
		<p>Test: {{component}} {{parent}}</p>
		<button type="button" (click)="update"></button>
		<p>{{value}}</p>
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

	it("should render the content with inherited properties",()=>{
		expect(context[0].children[0].textContent).toBe(`Test: ${componentData.component} ${data.parent}`);
	});

	it("should update the parent scope when changing a property that exists on parent scope but not on child scope",done=>{
		context[0].children[1].dispatchEvent(new Event("click"));
		setTimeout(()=>{
			expect(data.value).toBe(newValue);
			expect(context[0].children[2].textContent).toBe(newValue);
			done();
		},0);
	});

});