
describe("dill change",()=>{

	const Data = function(){
		this.one = "1";
		this.two = "2";
	}

	let context;
	let data;
	let scope;

	const ExampleComponent = function(){
		this.oninit = function() {
			scope = this;
		}
	};
	ExampleComponent.component = new dill.Component("example",`
		<p>One: {one}</p>
		<p>Two: {two}</p>
	`);

	beforeEach(()=>{
		document.body.innerHTML = `<example></example>`;
		context = document.body.children[0].children;
		dill.reset();
		data = dill.create(
            dill.module("test").setComponent(ExampleComponent)
            ,Data,document.body);
	});

	describe("when using a conditional element on change",()=>{
		it("should only update the targeted element",done=>{
			data.one = "11";
			data.two = "22";

			dill.change(scope.dillTemplate);

			setTimeout(()=>{
				expect(context[0].textContent).toBe("One: " + data.one);
				expect(context[1].textContent).toBe("Two: " + data.two);
				done();
			},0);
		});
	});
});
