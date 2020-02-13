
import { Template } from "./Template.model";
import { render } from "../render/render";
import { apps } from "./apps";
import { createData } from "../common/create-data";

export var create = function(dillModule,Data,element){
    var data = createData(new Data());
    data._module = dillModule;
    var template = new Template(dillModule,data,element);
    apps.push(template);
    data.onprerender && data.onprerender();
    render(template,0);
    data.oninit && data.oninit();
    return data;
}
