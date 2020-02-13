
describe("add events to elements | ",()=>{

	const run = jasmine.createSpy();
	const change = jasmine.createSpy();

	const Data = function(){
		this.keycode = null;
		this.run = function(){
			run();
			result = arguments;
		}
		this.run2 = () => false;
		this.change = function(){change();}
		this.key = function(event){
			this.key = event.keyCode;
		}
	}


	let context;
	let data;

	beforeEach(()=>{
		document.body.innerHTML = `
			<div>
				<button type="button" (click)="run"></button>
				<input (change)="change" (keyup)="key" />
				<button type="button" (click)="run2"></button>
			</div>
		`;
		context = document.body.children[0].children;
		dill.reset();
		data = dill.create(dill.module("test"),Data,document.body);
	});

	it("should run function on event",()=>{
		context[0].dispatchEvent(new Event("click"));
		expect(run).toHaveBeenCalled();
	});

	it("should remove the event attribute",()=>{
		expect(context[0].attributes["(click)"]).toBe(undefined);
	});

	it("should give two arguments",()=>{
		context[0].dispatchEvent(new Event("click"));
		expect(result.length).toBe(2);
	});

	it("should give first argument as Event instance",()=>{
		context[0].dispatchEvent(new Event("click"));
		expect(result[0] instanceof Event).toBe(true);
	});

	it("should give second argument as Element that called it",()=>{
		context[0].dispatchEvent(new Event("click"));
		expect(result[1] instanceof Element).toBe(true);
		expect(result[1]).toBe(context[0]);
	});

	it("should run dill.change on event",()=>{
		context[0].dispatchEvent(new Event("click"));
	});

	it("should not run dill.change on event if event returns false",()=>{
		const changeSpy = jasmine.createSpy(dill, "change");
		context[2].dispatchEvent(new Event("click"));
		expect(changeSpy).not.toHaveBeenCalled();
	});

	it("should add change event to input element",()=>{
		context[1].dispatchEvent(new Event("change"));
		expect(change).toHaveBeenCalled();
	});

	it("should run keyup",()=>{
		const keyCode = 37;
		context[1].dispatchEvent(new KeyboardEvent("keyup",{keyCode}));
		expect(data.key).toBe(keyCode);
	});
});
