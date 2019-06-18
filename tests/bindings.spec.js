
describe("bind properties to view | ",()=>{

	const expectedOutcomes = [
		"Example",
		"Example text",
		"Text Example",
		"Text Example text 2Example2 text",
		"3Example3"
	];

	const Data = function(){
		this.example = "Example";
		this.example2 = "2Example2";
		this.example3 = function(){
			return "3Example3";
		}
	}

	let context;

	beforeEach(()=>{
		document.body.innerHTML = `
			<div>
				<p>{{example}}</p>
				<p>{{example}} text</p>
				<p>Text {{example}}</p>
				<p>Text {{example}} text {{example2}} text</p>
				<p>{{example3}}</p>
				<p>{{example4}}</p>
			</div>
		`;
		context = document.body.children[0].children;
		dill.reset();
		dill.render(document.body,Data,dill.module());
	});

	it("should render property on scope where bindings are",()=>{
		expect(context[0].textContent).toBe(expectedOutcomes[0]);
	});

	it("should bindings when there is content and binding is at start",()=>{
		expect(context[1].textContent).toBe(expectedOutcomes[1]);
	});

	it("should bindings when there is content and binding is at the end",()=>{
		expect(context[2].textContent).toBe(expectedOutcomes[2]);
	});

	it("should render multiple bindings around content",()=>{
		expect(context[3].textContent).toBe(expectedOutcomes[3]);
	});

	it("should render bindings where property is a function",()=>{
		expect(context[4].textContent).toBe(expectedOutcomes[4]);
	});

	it("should render empty string when property doesn't exist",()=>{
		expect(context[5].textContent).toBe("");
		expect(context[5].textContent).not.toBe("undefined");
	});
});
