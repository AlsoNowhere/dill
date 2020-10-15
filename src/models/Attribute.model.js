
export const Attribute = function(
    name,
    value,
    dillAttribute = false
){
    this.name = name;
    this.value = value;
    this.dillAttribute = dillAttribute;

    Object.freeze(this);
}
