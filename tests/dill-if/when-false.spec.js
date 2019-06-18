
describe("dill if when false | ",()=>{

	const run = jasmine.createSpy();

	const Data = function(){
		this.case = false;
	}

	const ExampleComponent = dill.component("example",{
		oninit(){
			run();
		}
	},``);

	let context;
	let data;

	beforeEach(()=>{
		document.body.innerHTML = `
			<div>
				<example dill-if="case"></example>
			</div>
		`;
		context = document.body.children[0].children[0].children;
		dill.reset();
		const tmodule = dill.module();
		tmodule.setComponent(ExampleComponent);
		data = dill.render(document.body,Data,tmodule);
	});

	it("should not template element if value is false",()=>{
		expect(run).not.toHaveBeenCalled();
	});


});
