
describe("dill template - string | ",()=>{

	const change = {run(){}};

	const Data = function(){
		this.run = function(){
			change.run();
		}
		this.title = "Example";
		this.type = "number";
		this.value = 90;
		this.template = `
			<button type="button" (click)="run">{title}</button>
			<input [type]="type" [value]="value" />
		`;
	}

	let context;
	let data;

	beforeEach(()=>{
		spyOn(change,"run");
		document.body.innerHTML = `
			<div>
				<div dill-template="template"></div>
			</div>
		`;
		context = document.body.children[0].children;
		dill.reset();
		data = dill.create(dill.module("test"),Data,document.body);
	});

	it("should add the content to the target with the attribute",()=>{
		expect(context[0].children.length).toBe(2);
	});

	it("should remove the attribute",()=>{
		expect(context[0].attributes["dill-template"]).toBe(undefined);
	});

	it("should add event listeners in the new content",()=>{
		context[0].children[0].dispatchEvent(new Event("click"));
		expect(change.run).toHaveBeenCalled();
	});

	it("should render content",()=>{
		expect(context[0].children[0].textContent).toBe(data.title);
	});

	it("should render attribute bindings",()=>{
		expect(context[0].children[1].attributes.type.nodeValue).toBe(data.type);
	});

	it("should add binding properties to elements",()=>{
		expect(context[0].children[1].value).toBe(data.value.toString());
	});

	describe("on change",()=>{
		it("should render the template if it changes",done=>{
			data.template = ``;
			dill.change();
			setTimeout(()=>{
				expect(context[0].children.length).toBe(0);
				done();
			},0);
		});
	});

});
