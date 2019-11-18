
export const DillComponent = function(component){
    const proto = component.prototype;

    this.name = proto.name;
    this.template = proto.template;
    if (!!proto.module) {
        this._module = proto.module;
    }

    component.prototype = {};

    this.baseData = new component();
}

