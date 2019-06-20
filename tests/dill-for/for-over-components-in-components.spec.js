
describe("for over recursive components",()=>{

	const Data = function(){
		this.list = ["one"];
	}

	let context;
	let data;
	let scopeData;

	const ExampleComponentOne = dill.component("example-one",{
		oninit(){
			scopeData = this;
		}
	},`<example-two></example-two>`);

	const ExampleComponentTwo = dill.component("example-two",{},`<p>Two</p>`);

	beforeEach(()=>{
		document.body.innerHTML = `
			<div>
				<example-one dill-for="list"></example-one>
			</div>
		`;
		context = document.body.children[0].children;
		dill.reset();
		const tmodule = dill.module();
		tmodule.setComponent(ExampleComponentOne);
		tmodule.setComponent(ExampleComponentTwo);
		data = dill.render(document.body,Data,tmodule);
	});

	describe("when looping over a component that contains another component",()=>{
		it("should add the for scope before rendering the component",()=>{
			expect(scopeData._item).toBe("one");
			expect(scopeData._index).toBe(0);
		});
	});

});
