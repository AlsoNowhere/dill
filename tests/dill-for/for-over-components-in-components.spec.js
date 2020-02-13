
describe("for over recursive components",()=>{

	const Data = function(){
		this.list = ["one"];
	}

	let scopeData;

	const ExampleComponentOne = function(){
		this.oninit = function(){
			scopeData = this;
		}
	}
	ExampleComponentOne.component = new dill.Component("example-one",`<example-two></example-two>`);

	const ExampleComponentTwo = function(){}
	ExampleComponentTwo.component = new dill.Component("example-two",`<p>Two</p>`);

	beforeEach(()=>{
		document.body.innerHTML = `
			<div>
				<example-one dill-for="list"></example-one>
			</div>
		`;
		context = document.body.children[0].children;
		dill.reset();
		const tmodule = dill.module("test");
		tmodule.setComponent(ExampleComponentOne);
		tmodule.setComponent(ExampleComponentTwo);
		dill.create(tmodule,Data,document.body);
	});

	describe("when looping over a component that contains another component",()=>{
		it("should add the for scope before rendering the component",()=>{
			expect(scopeData._item).toBe("one");
			expect(scopeData._index).toBe(0);
		});
	});

});
