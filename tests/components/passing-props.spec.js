
describe("passing props to a component",()=>{

    const testValue = "Example";
    const testValue2 = "New value";

	const Data = function(){
        this.value = testValue;
    }

	let componentScope;
    
    const ExampleComponent = function(){
        this.oninit = function(){
            componentScope = this;
        }
        this.update = function(){
            this.inheritedvalue = testValue2;
        }
    }
    ExampleComponent.component = new dill.Component("example",``);

	let data;

	describe("when a component has a prop defined 'normally' i.e inheritedvalue=\"value\"",()=>{
        beforeEach(()=>{
            document.body.innerHTML = `
                <div>
                    <example inheritedvalue="value"></example>
                </div>
            `;
            dill.reset();
            const dmodule = dill.module("test");
            dmodule.setComponent(ExampleComponent);
            data = dill.create(dmodule,Data,document.body);
        });

		it("should appear on the component scope as a property on that object",()=>{
            expect(componentScope.hasOwnProperty("inheritedvalue")).toBe(true);
        });

        it("should add that property value to the component scope",()=>{
            expect(componentScope["inheritedvalue"]).toBe(testValue);
        });

        it("should have a link to the parent via getter setter so that the parent scope is changed when this property is changed",done => {
            componentScope.update();
            dill.change();
            setTimeout(()=>{
                expect(data.value).toBe(testValue2);
                done();
            },0);
        });
    });
    
    describe("when adding a prop as a property that is camelCase i.e inheritedValue=\"value\"",()=>{
        beforeEach(()=>{
            document.body.innerHTML = `
                <div>
                    <example inheritedValue="value"></example>
                </div>
            `;
            dill.reset();
            const dmodule = dill.module("test");
            dmodule.setComponent(ExampleComponent);
            data = dill.create(dmodule,Data,document.body);
        });

        it("should add that property as flatcase. (HTML squashes all to lower case).",()=>{
            expect(componentScope.hasOwnProperty("inheritedvalue")).toBe(true);
        });

        it("should add that property value to the component scope",()=>{
            expect(componentScope["inheritedvalue"]).toBe(testValue);
        });
    });

    describe("when adding a prop as a literal",()=>{
        beforeEach(()=>{
            document.body.innerHTML = `
                <div>
                    <example inheritedvalue="'value'"></example>
                </div>
            `;
            dill.reset();
            const dmodule = dill.module("test");
            dmodule.setComponent(ExampleComponent);
            data = dill.create(dmodule,Data,document.body);
        });

        it("should add that property value to the component scope",()=>{
            expect(componentScope.hasOwnProperty("inheritedvalue")).toBe(true);
            expect(componentScope["inheritedvalue"]).toBe("value");
        });
    });
});
