
import { forEach } from "../common/for-each";
import { createAttributes } from "./create-attributes/create-attributes";
import { createIf } from "./create-attributes/create-if";
import { createComponent } from "./create-component";
import { createFor } from "./create-attributes/create-for";
import { createDillTemplate } from "./create-attributes/create-dill-template";

var id = 0;

export var Template = function(dillModule,data,element,parentTemplate){
    var isIf;
    this.id = ++id;
    this.parent = parentTemplate || null;
    this.name = element.nodeName;
    this._module = dillModule;
    this.data = data;
    this.element = element;
    if (this.name === "#comment" || this.name === "SCRIPT") {
        return;
    }
    if (this.name === "#text") {
        this.textValue = element.nodeValue;
        return;
    }

    if (element.attributes["dill-ignore"]) {
        return;
    }

    isIf = createIf(this);
    if (!isIf) {
        return;
    }

    if (element.attributes["dill-for"]) {
        createFor(this);
        return;
    }

    this.component = createComponent(this);

    createDillTemplate(this);
    
    if (!this.component) {
        createAttributes(this);
    }

    this.childTemplates = forEach(element.childNodes,function(x){
        return new Template(dillModule,this.data,x,this);
    }.bind(this));

    this.component && this.data.hasOwnProperty("oninit") && this.data.oninit();
}
