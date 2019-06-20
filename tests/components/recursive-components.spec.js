
describe("recursive components",()=>{

	let timesCalled = 0;

	const Data = function(){};

	const ExampleComponent = dill.component("example",{
		oninit(){
			timesCalled++;
			if (timesCalled > 2) {
				throw new Error("Called too many times. Test will now fail");
			}
		}
	},`<example></example>`);

	beforeEach(()=>{
		dill.reset();
	});

	describe("when a component contains itself",()=>{
		it("should be stopped from rendering if component does not have a dill if attribute",()=>{
			expect(function(){
				document.body.innerHTML = `
					<div>
						<example></example>
					</div>
				`;
				const tmodule = dill.module();
				tmodule.setComponent(ExampleComponent);
				dill.render(document.body,Data,tmodule);
			}).toThrow(new Error("Recursive element detected without conditional catch. To avoid infinite loop render was stopped."));
		});
	});

});
