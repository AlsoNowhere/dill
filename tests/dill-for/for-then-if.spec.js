
describe("looping over items then an if",()=>{
	describe("when looping over an empty list and then reaching an element",()=>{
		const Data = function(){
			this.list = [];
		}

		let context;

		beforeEach(()=>{
			document.body.innerHTML = `
				<ul>
					<li dill-for="list">
						<ul>
							<li>
								<button type="button">{{_item}}</button>
							</li>
						</ul>
					</li>
					<li>Test</li>
				</ul>
			`;
			context = document.body.children;
			dill.reset();
			dill.create(dill.module("test"),Data,document.body);
		});

		it("should render correctly",()=>{
			expect(context[0].children.length).toBe(1);
		});
	});

	describe("when looping over an empty list and then reaching a true dill if",()=>{
		const Data = function(){
			this.list = [];
			this.case = true;
		}

		let context;
		let data;

		beforeEach(()=>{
			document.body.innerHTML = `
				<ul>
					<li dill-for="list">{{_item}}</li>
					<li dill-if="case">Test</li>
				</ul>
			`;
			context = document.body.children;
			dill.reset();
			dill.create(dill.module("test"),Data,document.body);
		});

		it("should render correctly",()=>{
			expect(context[0].children.length).toBe(1);
		});
	});

	describe("when looping over an empty list and then reaching a false dill if",()=>{
		const Data = function(){
			this.list = [];
			this.case = false;
		}

		let context;
		let data;

		beforeEach(()=>{
			document.body.innerHTML = `
				<ul>
					<li dill-for="list">{{_item}}</li>
					<li dill-if="case">Test</li>
				</ul>
			`;
			context = document.body.children;
			dill.reset();
			dill.create(dill.module("test"),Data,document.body);
		});

		it("should render correctly",()=>{
			expect(context[0].children.length).toBe(0);
		});
	});
});
