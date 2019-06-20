
describe("dill for - objects | ",()=>{

	const Data = function(){
		this.list = ["One", "Two", "Three"].map(x=>({name:x}));
	}

	let context;
	let data;

	beforeEach(()=>{
		document.body.innerHTML = `
			<div>
				<li dill-for="list">Test: {{name}} {{_index}} {{value}}</li>
			</div>
		`;
		context = document.body.children[0].children;
		dill.reset();
		data = dill.render(document.body,Data,dill.module());
	});

	it("should render the correct number of nodes",()=>{
		expect(context.length).toBe(data.list.length);
	});

	it("should render the correct value and index",()=>{
		[...context].forEach((each,index)=>{
			expect(each.textContent).toBe(`Test: ${data.list[index].name} ${index} ${data.list[index].value||''}`);
		});
	});

	describe("on change",()=>{
		it("should persist the existing nodes on no value change",done=>{
			const recordNodes = [...context].map(x=>x);
			dill.change();
			setTimeout(()=>{
				recordNodes.forEach((e,i)=>{
					expect(e).toBe(context[i]);
				});
				done();
			},0);
		});

		describe("list item",()=>{
			it("should retain node if object is the same",done=>{
				const recordNodes = [...context].map(x=>x);
				data.list[0].name = "_One_";
				dill.change();
				setTimeout(()=>{
					recordNodes.forEach((e,i)=>{
						expect(e).toBe(context[i]);
					});
					done();
				},0);
			});

			it("should create a new node when the object has changed",done=>{
				const recordNodes = [...context].map(x=>x);
				data.list[0] = {name:"_One_"};
				dill.change();
				setTimeout(()=>{
					recordNodes.forEach((e,i)=>{
						if (i === 0) {
							return;
						}
						expect(e).toBe(context[i]);
					});
					expect(context[0]).not.toBe(recordNodes[0]);
					done();
				},0);
			});

			it("should show new properties if object is same",done=>{
				data.list[0].value = "11";
				dill.change();
				setTimeout(()=>{
					[...context].forEach((each,index)=>{
						expect(each.textContent).toBe(`Test: ${data.list[index].name} ${index} ${data.list[index].value||''}`);
					});
					done();
				},0);
			});
		});
	});

});
