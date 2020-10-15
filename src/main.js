
import { createDillElement } from "./services/create-dill-element.service";
import { createDillApp } from "./services/create-dill-app.service";
import { setUpChange } from "./services/change.service";

import { Component } from "./models/Component.model";
import { render } from "./services/render/render.service";

export const dill = new function Dill(){
    this.Component = Component;
    this.element = createDillElement;
    this.create = createDillApp;
    this.change = setUpChange(render);
};
window.dill = dill;
