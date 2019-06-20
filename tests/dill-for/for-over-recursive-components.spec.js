
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

	let context;
	let data;
	let timesCalled = 0;

	const ExampleComponent = dill.component("example",{
		oninit(){
			timesCalled++;
		}
	},`<example dill-for="list"></example>`);

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

	describe("when looping over a component that contains itself",()=>{
		xit("should stop rendering at an empty list",()=>{
			expect(timesCalled).toBe(2);
		});
	});

});
