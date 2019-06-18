
describe("abstract components",()=>{

	const Data = function(){}

	let context;

	const ComponentOne = dill.component("one",{},`<three></three>`);
	const ComponentTwo = dill.component("two",{},`<three></three>`);
	const ComponentThree = dill.component("three",{},`<p></p>`,null,[ComponentOne]);

	beforeEach(()=>{
		document.body.innerHTML = `
			<div>
				<one></one>
				<two></two>
			</div>
		`;
		context = document.body.children[0].children;
		dill.reset();
		const tmodule = dill.module();
		tmodule.setComponent(ComponentOne);
		tmodule.setComponent(ComponentTwo);
		tmodule.setComponent(ComponentThree);
		dill.render(document.body,Data,tmodule);
	});

	describe("when component has abstract component conditions",()=>{
		describe("and component does not meet those conditions",()=>{
			it("should not render the component",()=>{
				expect(context[1].children[0].children.length).toBe(0);
			});
		});

		describe("and component does meet those conditions",()=>{
			it("should render the component",()=>{
				expect(context[0].children[0].children.length).toBe(1);
				expect(context[0].children[0].children[0].nodeName).toBe("P");
			});
		});
	});

});
