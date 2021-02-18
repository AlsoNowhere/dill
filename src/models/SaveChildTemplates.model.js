
export const SaveChildTemplates = function(
    referenceData,
    childTemplates = null
){
    this.referenceData = referenceData;
    this.childTemplates = childTemplates;

    Object.seal(this);
}
