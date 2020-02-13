
describe("for over recursive components",()=>{

	const Data = function(){
		this.list = [
			{
				list: [
					{
						list: []
					}
				]
			}
		];
	}

	let timesCalled = 0;

	const ExampleComponent = function(){
		this.oninit = function(){
			timesCalled++;
			if (timesCalled > 10) {
				throw new Error("Way too many times");
			}
		}
	};
	ExampleComponent.component = new dill.Component("example",`<example dill-for="list"></example>`);

	beforeEach(()=>{
		document.body.innerHTML = `
			<div>
				<example dill-for="list"></example>
			</div>
		`;
		dill.reset();
		const tmodule = dill.module("test").setComponent(ExampleComponent);
		dill.create(tmodule,Data,document.body);
	});

	describe("when looping over a component that contains itself",()=>{
		it("should stop rendering at an empty list",()=>{
			expect(timesCalled).toBe(2);
		});
	});

});
