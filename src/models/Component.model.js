
export const Component = function(
    elements,
    isolated = false
){
    this.elements = elements;
    this.isolated = isolated;

    Object.freeze(this);
}
