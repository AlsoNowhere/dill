
describe("render attributes | ",()=>{

	const Data = function(){
		this.user = "John Doe";
		this.type = "email";
		this.type2 = function(){
			return "number";
		}
		this.value = "example";
		this.case = true;
	}

	let context;
	let data;

	beforeEach(()=>{
		document.body.innerHTML = `
			<div>
				<input [type]="type" placeholder="Welcome {{user}}" #input />
				<input [type]="type2" />
				<input [type]="'email'" />
				<input [value]="value" />
				<input type="checked" [checked]="case" />
			</div>
		`;
		context = document.body.children[0].children;
		dill.reset();
		data = dill.render(document.body,Data,dill.module());
	});

	it("should render a binding inside an attribute",()=>{
		const expected = "Welcome " + data.user;
		expect(context[0].attributes.placeholder.nodeValue).toBe(expected);
	});

	it("should render an attribute binding",()=>{
		expect(context[0].attributes.type.nodeValue).toBe(data.type);
	});

	it("should render an attribute binding and remove structure attribute",()=>{
		expect(context[0].attributes["[type"]).toBe(undefined);
	});

	it("should render an attribtue binding when property is a function",()=>{
		expect(context[1].attributes.type.nodeValue).toBe(data.type2());
	});

	describe("when attribute is property",()=>{
		it("should set the value",()=>{
			expect(context[3].value).toBe(data.value);
		});

		it("should make the input checked",()=>{
			expect(context[4].checked).toBe(true);
		});
	});

	it("should get an element reference using the pound symbol",()=>{
		expect(data.input).toBe(context[0]);
	});
});
