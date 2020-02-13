
describe("dill if | ",()=>{
	const Data = function(){
		this.case1 = true;
		this.case2 = false;
	}

	let contextParent;
	let context;
	let data;

	beforeEach(()=>{
		document.body.innerHTML = `
			<div>
				<ul><li dill-if="case1">One</li><li dill-if="case2">Two</li></ul>
			</div>
		`;
		contextParent = document.body.getElementsByTagName("UL")[0];
		context = contextParent.children;
		dill.reset();
		data = dill.create(dill.module("test"),Data,document.body);
	});

	it("should only have specified elements",()=>{
		expect(context.length).toBe(1);
		expect(contextParent.childNodes.length).toBe(1);
	});

	it("should remove the correct node",()=>{
		expect(context[0].textContent).toBe("One");
	});

	describe("when adding the second element back in",()=>{
		beforeEach(()=>{
			data.case2 = true;
			dill.change();
		});

		it("should add the element back in",done=>{
			setTimeout(()=>{
				expect(context.length).toBe(2);
				done();
			},0);
		});

		it("should not add extra textnodes in",done=>{
			setTimeout(()=>{
				expect(contextParent.childNodes.length).toBe(2);
				done();
			},0);
		});

		it("should add the correct node in ",done=>{
			setTimeout(()=>{
				expect(context[0].textContent).toBe("One");
				expect(context[1].textContent).toBe("Two");
				done();
			},0);
		});
	});

});
