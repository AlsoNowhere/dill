
describe("creating a render",()=>{

	const Data = function(){
		
	}

	let context;
	let data;

	beforeEach(()=>{
		dill.reset();
	});

	it("should reject a module if not an instance of Module",()=>{
		expect(function(){
			dill.render(document.body,Data,{})
		}).toThrow(new Error("You must pass a Dill Module instance."));
	});

	it("should reject a scope if not a constructor function",()=>{
		expect(function(){
			dill.render(document.body,{},dill.module())
		}).toThrow(new Error("You must pass a constructor function as the original Data."));
	});

	it("should reject a scope if not passing in an element node",()=>{
		expect(function(){
			dill.render({},Data,dill.module())
		}).toThrow(new Error("You must pass a HTML element as the target."));
	});

});
