
describe("looping over components",()=>{

	const Data = function(){
		this.list = ["one"];
	}

	let context;
	let data;
	let scopeData;
	let timesCalled = 0;

	const ExampleComponent = dill.component("example",{
		oninit(){
			scopeData = this;
			timesCalled++;
		}
	},`<p>{{_item}} {{_index}}</p>`);

	beforeEach(()=>{
		timesCalled = 0;
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

	describe("when looping over a component element",()=>{
		it("should only call oninit for the length of the list",()=>{
			expect(timesCalled).toBe(1);
		});

		it("should add _item to the component data",()=>{
			expect(scopeData._item).toBe(data.list[0]);
		});

		it("should add _index to the component data",()=>{
			expect(scopeData._index).toBe(0);
		});
	});

});
