
describe("extend attribute | ",()=>{

	const change = {run(){}};

	const Data = function(){
		this.type = "email";
		this.user = "Joe B";
		this.onchange = () => change.run();
		this.input = {
			"[type]": "type",
			class: "form-control",
			placeholder: "Welcome {user}",
			"(change)": "onchange"
		}
	}

	let context;
	let data;

	beforeEach(()=>{
		document.body.innerHTML = `
			<div>
				<input dill-extends="input" />
			</div>
		`;
		context = document.body.children[0].children;
		dill.reset();
		data = dill.create(dill.module("test"),Data,document.body);
	});

	it("should remove the attribute",()=>{
		expect(context[0].attributes["dill-extends"]).toBe(undefined);
	});

	it("should add the correct type",()=>{
		expect(context[0].attributes["type"].nodeValue).toBe(data.type);
	});

	it("should add the correct classes",()=>{
		expect(context[0].attributes.class.nodeValue).toBe(data.input.class);
	});

	it("should add the correct placeholder",()=>{
		expect(context[0].attributes.placeholder.nodeValue).toBe(`Welcome ${data.user}`);
	});

	it("should add the event",()=>{
		spyOn(change,"run");
		context[0].dispatchEvent(new Event("change"));
		expect(change.run).toHaveBeenCalled();
	});
});
