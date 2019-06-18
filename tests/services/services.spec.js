
describe("create a dill service | ",()=>{

	const Data = function(){
		
	}

	let context;
	let data;

	const ExampleServiceObj = dill.service("exampleObj",{});
	const ExampleServiceFunc = dill.service("exampleFunc",function(){});

	const tmodule = dill.module();

	beforeEach(()=>{
		document.body.innerHTML = `
			<div>
				
			</div>
		`;
		context = document.body.children[0].children;
		dill.reset();
		data = dill.render(document.body,Data,tmodule);
	});

	it("should add service defined with an anonymous object",()=>{
		tmodule.setService(ExampleServiceObj);
		expect(tmodule.services["exampleObj"]).toBeDefined();
	});

	it("should add service defined with a constructor function",()=>{
		tmodule.setService(ExampleServiceFunc);
		expect(tmodule.services["exampleFunc"]).toBeDefined();
	});

});
