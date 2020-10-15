
export var Component = function(
    name,
    template,
    isolated = false
){
    this.name = name;
    this.template = template instanceof Array
        ? template
        : [template];
    this.isolated = isolated;
}
