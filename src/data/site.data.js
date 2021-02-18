
export const site = new function SiteData(){
    this.app = null;
    this.strictMode = false;
    this.devMode = false;
    this.generateDillTemplate = null;
    this.render = null;
    this.change = null;
    this.runChangeOnEvents = true;

    Object.seal(this);
}
