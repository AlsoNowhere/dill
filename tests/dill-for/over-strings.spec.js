
describe("dill for - strings | ",()=>{

	const Data = function(){
		this.list = ["One", "Two", "Three"];
	}

	let context;
	let data;

	beforeEach(()=>{
		document.body.innerHTML = `
			<div>
				<li dill-for="list">Test: {{_item}} {{_index}}</li>
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
		[...context].forEach((e,i)=>{
			expect(e.textContent).toBe(`Test: ${data.list[i]} ${i}`);
		});
	});

	describe("on change",()=>{
		it("should persist the existing nodes on no value change",done=>{
			const recordNodes = [...context].map(x=>x);
			dill.change();
			setTimeout(()=>{
				recordNodes.forEach((each,i)=>{
					expect(each).toBe(context[i]);
				});
				done();
			},0);
		});

		describe("list changed",()=>{
			it("should render changes to the list when list extended",done=>{
				data.list.push("Four");
				dill.change();
				setTimeout(()=>{
					[...context].forEach((each,index)=>{
						expect(each.textContent).toBe(`Test: ${data.list[index]} ${index}`);
					});
					done();
				},0);
			});

			it("should render changes to the list when list reduced",done=>{
				data.list.splice(1, 2);
				dill.change();
				setTimeout(()=>{
					[...context].forEach((each,index)=>{
						expect(each.textContent).toBe(`Test: ${data.list[index]} ${index}`);
					});
					done();
				},0);
			});

			it("should show no elements when list length is 0",done=>{
				data.list.length = 0;
				dill.change();
				setTimeout(()=>{
					expect(context.length).toBe(0);
					done();
				},0);
			});

			it("should render changes to the list when list extended after having no length",done=>{
				data.list.push("Four");
				dill.change();
				setTimeout(()=>{
					[...context].forEach((each,index)=>{
						expect(each.textContent).toBe(`Test: ${data.list[index]} ${index}`);
					});
					done();
				},0);
			});
		});
	});

});
