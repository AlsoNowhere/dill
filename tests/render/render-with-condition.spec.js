
describe("-title-",()=>{

	const Data = function(){
		this.one = "1";
		this.two = "2";
	}

	let context;
	let data;

	beforeEach(()=>{
		document.body.innerHTML = `
			<div>
				<p>One: {{one}}</p>
				<p>Two: {{two}}</p>
			</div>
		`;
		context = document.body.children[0].children;
		dill.reset();
		data = dill.render(document.body,Data,dill.module());
	});

	describe("when using a conditional element on change",()=>{
		it("should only update the targeted element",done=>{
			data.one = "11";
			data.two = "22";
			dill.change(context[0]);
			setTimeout(()=>{
				expect(context[0].textContent).toBe("One: " + data.one);
				expect(context[1].textContent).not.toBe("Two: " + data.two);
				done();
			},0);
		});
	});

});
