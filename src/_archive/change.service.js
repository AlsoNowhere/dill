
import { site } from "../data/site.data";

const change = render => componentContext => {
    render(

/*
    Calling dill.change() will cause a rerender of a given Component.
    If no Component is provided then the whole app gets reendered.
    This is not great for performance.
    When an event fires in runs a rerender globally by default but this can be prevented by writing code to target specific Components to rerender.
*/
        componentContext
            ? componentContext._dillContext
            : site.app
    );
}

/*
    In order to prevent a cyclic dependency we need to give the change function context here.
*/

export const setUpChange = render => change(render);
