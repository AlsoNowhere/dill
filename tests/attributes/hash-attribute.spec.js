describe("hash attribute",()=>{

	const Data = function(){
        this.span = null;
	}

    let context;
    let data;

	beforeEach(()=>{
		document.body.innerHTML = `
			<div>
				<span #span>Great turn yang</span>
			</div>
		`;
		context = document.body.children[0].children;
		dill.reset();
		data = dill.create(dill.module("test"),Data,document.body);
	});

	describe("when attribute has hash at start",()=>{
		it("should add the element to the scope",()=>{
            expect(data.span).not.toBe(null);
            expect(data.span.nodeName).toBe("SPAN");
            expect(data.span.textContent).toBe("Great turn yang");
		});
	});
});
