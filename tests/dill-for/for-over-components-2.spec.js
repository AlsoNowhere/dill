
describe("for over components",()=>{

	const Data = function(){
		this.example = "Root";
		this.list = ["One","Two"];
	}

	const componentValue = "Copo";

	const ExampleComponent = function(){
		this.example = componentValue;
	};
	ExampleComponent.component = new dill.Component("example",`<p>{example} {_item} {_index}</p>`);

	let context;
	let data;

	beforeEach(()=>{
		document.body.innerHTML = `
			<div>
				<example dill-for="list"></example>
			</div>
		`;
		dill.reset();
		const tmodule = dill.module("test");
		tmodule.setComponent(ExampleComponent);
		data = dill.create(tmodule,Data,document.body);
	});

	describe("when looping over a component twice",()=>{
		it("should create two new scopes for each item",()=>{
			const content1 = `${componentValue} ${data.list[0]} 0`;
			const content2 = `${componentValue} ${data.list[1]} 1`;
			expect(document.body.children[0].children[0].textContent).toBe(content1);
			expect(document.body.children[0].children[1].textContent).toBe(content2);
		});
	});

});
