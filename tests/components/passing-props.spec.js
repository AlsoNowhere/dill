
describe("passing props to a component",()=>{

    const testValue = "Example";
    const testValue2 = "New value";

	const Data = function(){
        this.value = testValue;
    }

	let componentScope;

	const ExampleComponent = dill.component("example",{
		oninit(){
			componentScope = this;
        },
        update(){
            this.inheritedvalue = testValue2;
        }
	},``);

	let data;

    describe("when a component has a prop defined 'wrong' i.e where the prop name is the same as the prop to be set value=\"value\"",()=>{
        beforeEach(()=>{
            document.body.innerHTML = `
                <div>
                    <example value="value"></example>
                </div>
            `;
            dill.reset();
            const dmodule = dill.module();
            dmodule.setComponent(ExampleComponent);
            data = dill.render(document.body,Data,dmodule);
        });
    
		it("should not appear on the component scope as a property on that object",()=>{
            expect(componentScope.hasOwnProperty("value")).toBe(false);
        });
	});

	describe("when a component has a prop defined 'normally' i.e inheritedvalue=\"value\"",()=>{
        beforeEach(()=>{
            document.body.innerHTML = `
                <div>
                    <example inheritedvalue="value"></example>
                </div>
            `;
            dill.reset();
            const dmodule = dill.module();
            dmodule.setComponent(ExampleComponent);
            data = dill.render(document.body,Data,dmodule);
        });

		it("should appear on the component scope as a property on that object",()=>{
            expect(componentScope.hasOwnProperty("inheritedvalue")).toBe(true);
        });

        it("should add that property value to the component scope",()=>{
            expect(componentScope["inheritedvalue"]).toBe(testValue);
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
            const dmodule = dill.module();
            dmodule.setComponent(ExampleComponent);
            data = dill.render(document.body,Data,dmodule);
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
            const dmodule = dill.module();
            dmodule.setComponent(ExampleComponent);
            data = dill.render(document.body,Data,dmodule);
        });

        it("should add that property value to the component scope",()=>{
            expect(componentScope.hasOwnProperty("inheritedvalue")).toBe(true);
            expect(componentScope["inheritedvalue"]).toBe("value");
        });
    });

    describe("when adding a prop that is in square brackets ([value])",()=>{
        describe("when value is a property look up",()=>{
            beforeEach(()=>{
                document.body.innerHTML = `
                    <div>
                        <example [inheritedvalue]="value"></example>
                    </div>
                `;
                dill.reset();
                const dmodule = dill.module();
                dmodule.setComponent(ExampleComponent);
                data = dill.render(document.body,Data,dmodule);
            });
    
            it("should add that property to this scope",()=>{
                expect(componentScope.hasOwnProperty("inheritedvalue")).toBe(true);
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
    });
});
