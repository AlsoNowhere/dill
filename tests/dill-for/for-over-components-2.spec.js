
describe("for over components",()=>{

	const Data = function(){
		this.example = "Root";
		this.list = ["One","Two"];
	}

	const componentValue = "Copo";

	const ExampleComponent = dill.component("example",{example:componentValue},`
		<p>{{example}} {{_item}} {{_index}}</p>
	`);

	let context;
	let data;

	beforeEach(()=>{
		document.body.innerHTML = `
			<div>
				<example dill-for="list"></example>
			</div>
		`;
		context = document.body.children[0].children;
		dill.reset();
		const tmodule = dill.module();
		tmodule.setComponent(ExampleComponent);
		data = dill.render(document.body,Data,tmodule);
	});

	describe("when looping over a component twice",()=>{
		it("should create two new scopes for each item",()=>{
			const content1 = `${componentValue} ${data.list[0]} 0`;
			const content2 = `${componentValue} ${data.list[1]} 1`;
			expect(context[0].children[0].textContent).toBe(content1);
			expect(context[1].children[0].textContent).toBe(content2);
		});
	});

});
