
describe("dill if | ",()=>{

	const Data = function(){
		this.test = "|";
		this.case1 = true;
		this.case2 = false;
	}

	let context;
	let data;

	beforeEach(()=>{
		document.body.innerHTML = `
			<div>
				<ul>
					<li>One {{test}}</li>
					<li dill-if="case1">Two {{test}}</li>
					<li>Three {{test}}</li>
					<li dill-if="case2">Four {{test}}</li>
					<li>Five {{test}}</li>
					<li dill-if="!case1">Six {{test}}</li>
					<li>Seven {{test}}</li>
				</ul>
			</div>
		`;
		context = document.body.children[0].children[0].children;
		dill.reset();
		data = dill.render(document.body,Data,dill.module());
	});

	it("should retain element when value is true",()=>{
		expect(context.length).toBe(5);
		expect(context[1].textContent).toBe("Two |");
	});

	it("should remove element when value is false",()=>{
		expect(context.length).toBe(5);
		expect(context[3].textContent).toBe("Five |");
	});

	it("should invert the boolean value if prefixed with !",()=>{
		expect(context.length).toBe(5);
		expect(context[4].textContent).toBe("Seven |");
	});

	describe("after a refresh",()=>{
		it("should remove element which was retained on true and when value is now false",done=>{
			data.case1 = false;
			dill.change();
			setTimeout(()=>{
				expect(context[1].textContent).toBe("Three |");
				done();
			},0);
		});

		it("should replace element which was removed on false and when value is now true",done=>{
			data.case2 = true;
			dill.change();
			setTimeout(()=>{
				expect(context[3].textContent).toBe("Four |");
				done();
			},0);
		});
	});

});
