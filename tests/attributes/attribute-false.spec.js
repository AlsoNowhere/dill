
describe("False attribute binding values",()=>{

	const Data = function(){
		this.case1 = true;
		this.case2 = false;
	}

	let context;

	beforeEach(()=>{
		document.body.innerHTML = `
			<div>
				<button type="button" [disabled]="case1">Button</button>
				<button type="button" [disabled]="case2">Button</button>
				<button type="button" [disabled]="case3">Button</button>
			</div>
		`;
		context = document.body.children[0].children;
		dill.reset();
		dill.create(dill.module("test"),Data,document.body);
	});

	describe("when binding value is true",()=>{
		it("should add the attribute",()=>{
			expect(context[0].hasAttribute("disabled")).toBe(true);
		});

		it("should have attribute value of 'true'",()=>{
			expect(context[0].attributes["disabled"].nodeValue).toBe("true");
		});
	});

	describe("when binding value is false",()=>{
		it("should not add the attribute and remove the attribute binding attribute",()=>{
			expect(context[1].hasAttribute("disabled")).toBe(false);
		});
	});

	describe("when binding value is undefined",()=>{
		it("should not add the attribute and remove the attribute binding attribute",()=>{
			expect(context[2].hasAttribute("disabled")).toBe(false);
		});
	});

});
