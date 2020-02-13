
describe("dill for - surrounding content | ",()=>{

	const Data = function(){
		this.start = "Begin";
		this.end = "Finish";
		this.list = ["One","Two","Three"];
	}

	let context;
	let data;

	beforeEach(()=>{
		document.body.innerHTML = `
			<div>
				<ul>
					<li>{start}</li>
					<li dill-for="list"></li>
					<li>{end}</li>
				</ul>
			</div>
		`;
		context = document.body.children[0].children;
		dill.reset();
		data = dill.create(dill.module("test"),Data,document.body);
	});

	it("should render the surrounding elements correctly",()=>{
		expect(context[0].children[0].textContent).toBe(data.start);
		expect(context[0].children[data.list.length + 1].textContent).toBe(data.end);
	});

	describe("after list has changed",()=>{
		describe("by shortening",()=>{
			it("should render the surrounding elements correctly",done=>{
				data.list.pop();
				dill.change();
				setTimeout(()=>{
					expect(context[0].children[0].textContent).toBe(data.start);
					expect(context[0].children[data.list.length + 1].textContent).toBe(data.end);
					done();
				},0);
			});
		});

		describe("by growing",()=>{
			it("should render the surrounding elements correctly",done=>{
				data.list.push("Four","Five");
				dill.change();
				setTimeout(()=>{
					expect(context[0].children[0].textContent).toBe(data.start);
					expect(context[0].children[data.list.length + 1].textContent).toBe(data.end);
					done();
				},0);
			});
		});

		describe("list length becomes 0",()=>{
			it("should render the surrounding elements correctly",done=>{
				data.list.length = 0;
				dill.change();
				setTimeout(()=>{
					expect(context[0].children[0].textContent).toBe(data.start);
					expect(context[0].children[data.list.length + 1].textContent).toBe(data.end);
					done();
				},0);
			});
		});

		describe("list length grows after being 0",()=>{
			it("should render the surrounding elements correctly",done=>{
				data.list.push("Six","Seven");
				dill.change();
				setTimeout(()=>{
					expect(context[0].children[0].textContent).toBe(data.start);
					expect(context[0].children[data.list.length + 1].textContent).toBe(data.end);
					done();
				},0);
			});
		});
	});

});
