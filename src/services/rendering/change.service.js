
import { render } from "./render.service";

import { site } from "../../data/site.data";

export const change = componentContext => {

/*
    Calling dill.change() will cause a rerender of a given Component.
    If no Component is provided then the whole app gets reendered.
    This is not great for performance.
    When an event fires in runs a rerender globally by default but this can be prevented by writing code to target specific Components to rerender.
*/

    if (!!componentContext) {
        site.devMode && console.log("DILL DEV. CONTEXT PASSED TO DILL.CHANGE -> ", componentContext._dillContext);
        render(componentContext._dillContext);
    }
    else if (site.strictMode === false) {
        render(site.app);
    }
    else {
        console.warn("dill.change() was called with undefined will in strict mode, no render will be fired.");
    }
}

site.change = change;
