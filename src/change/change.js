import { forEach } from "../common/for-each";
import { render } from "../render/render";
import { apps } from "../create/apps";

export var change = function(template){
    if (template === undefined) {
        return forEach(apps,function(x){
            render(x);
        });
    }
    // To Do: Reload only the given template for better efficiency
    // ...
}
