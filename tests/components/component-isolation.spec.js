
describe("dill component - isolation | ",()=>{

	const parent = "Parent";
	const child = "Child";

	const Data = function(){
		this.value1 = parent;
		this.value2 = child;
	}

	let component;

	const newValue = "newValue";

	const ExampleComponent = function(){
		this.value1 = child;
		this.oninit = function(){
			component = this;
		}
		this.update = function(){
			this.value2 = newValue;
		}
	}
	ExampleComponent.component = new dill.Component("example",`
		<button type="button" (click)="update"></button>
	`);

	let context;
	let data;

	beforeEach(()=>{
		document.body.innerHTML = `
			<div>
				<example dill-isolate value2="value2"></example>
			</div>
		`;
		context = document.body.children[0].children[0];
		dill.reset();
		const dmodule = dill.module("dmodule");
		dmodule.setComponent(ExampleComponent);
		data = dill.create(dmodule,Data,context);
	});

	it("should remove the attribute",()=>{
		expect(context.attributes["dill-isolate"]).toBe(undefined);
	});

	it("should not inherit all values from parent scope",()=>{
		expect(component.value1).toBe(child);
	});

	it("should inherit values that are specified to be inherited",()=>{
		expect(component.value2).toBe(child);
	});

	it("should not be able to alter the parent scope",done=>{
		context.dispatchEvent(new Event("click"));
		setTimeout(()=>{
			expect(data.value2).toBe(child);
			expect(data.value2).not.toBe(newValue);
			done();
		},0);
	});

});
