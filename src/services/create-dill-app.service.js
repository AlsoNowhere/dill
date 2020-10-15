
import { createData } from "../dill-core/services/create-data.service";

import { generateDillTemplate } from "./generate-dill-template.service";
import { render } from "./render/render.service";
import { setUpChange } from "./change.service";

import { site } from "../data/site.data";

export const createDillApp = (rootElement, Data, dillElement) => {

/*
    Create a new app.
    By normal methods only one app can exist on the site at once (site.app property).
    However dill simply works by calling render and passing in a Template.
    If means that you can create any number of apps if they are saved somewhere in the app.
    This means the Dev can create portal apps.
*/

/* This newData will be the root data for the whole site. */
    const newData = createData(new Data());

/* Lifecycle hook. */
    newData.onpretemplate && newData.onpretemplate();

/* Generate the site template. */
    site.app = generateDillTemplate(null, rootElement, newData, dillElement, false, setUpChange(render));

/* Lifecycle hook. */
    newData.oninit && newData.oninit();

/* Render the site for the first time. */
    site.app.forEach(render);

/*
    Return the root data.
    This allows access to the rootdata outside the app.
    If the root element was a Component then this data will contain the _dillContext property which will allow the app Template to be accessed and saved.
    This allows the creation of portal apps.
*/
    return newData;
}
