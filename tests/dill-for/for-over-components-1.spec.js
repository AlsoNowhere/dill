
describe("looping over components",()=>{

	const Data = function(){
		this.list = ["one"];
	}

	let context;
	let data;
	let scopeData;
	let timesCalled = 0;

	const ExampleComponent = function(){
		this.oninit = function(){
			scopeData = this;
			timesCalled++;
		}
	}
	ExampleComponent.component = new dill.Component("example",`<p>{_item} {_index}</p>`);

	beforeEach(()=>{
		timesCalled = 0;
		document.body.innerHTML = `
			<div>
				<example dill-for="list"></example>
			</div>
		`;
		context = document.body.children[0].children[0];
		dill.reset();
		const tmodule = dill.module("test");
		tmodule.setComponent(ExampleComponent);
		data = dill.create(tmodule,Data,context);
	});

	describe("when looping over a component element",()=>{
		it("should only call oninit for the length of the list",()=>{
			expect(timesCalled).toBe(data.list.length);
		});

		it("should add _item to the component data",()=>{
			expect(scopeData._item).toBe(data.list[0]);
		});

		it("should add _index to the component data",()=>{
			expect(scopeData._index).toBe(0);
		});
	});
});
