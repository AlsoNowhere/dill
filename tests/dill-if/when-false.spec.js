
describe("dill if when false | ",()=>{

	const change = {run(){}};

	const Data = function(){
		this.case = false;
	}

	const ExampleComponent = function(){
		this.oninit = function(){
			change.run();
		}
	}
	ExampleComponent.component = new dill.Component("example",``);

	beforeEach(()=>{
		document.body.innerHTML = `
			<div>
				<example dill-if="case"></example>
			</div>
		`;
		document.body.children[0].children[0].children;
		dill.reset();
		const tmodule = dill.module("test").setComponent(ExampleComponent);
		spyOn(change,"run");
		dill.create(tmodule,Data,document.body);
	});

	it("should not template element if value is false",()=>{
		expect(change.run).not.toHaveBeenCalled();
	});
});
