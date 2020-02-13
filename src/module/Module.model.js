
export var Module = function(name, components){
    this.name = name;
    this.components = components;
    this.setComponent = function(Component){
        components[Component.component.name] = {
            Component: Component,
            template: Component.component.template,
            module: this,
            isolated: Component.component.isolated
        }
        return this;
    }
}
