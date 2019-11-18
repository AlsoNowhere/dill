
export var logger = {
    error: function(message){
        console.log(
            "%c " + message
            + "%c " + "- Generated from logger service",
            "color:red;",
            "color:grey;"
        );
    },
    warn: function(message) {
        console.warn(message);
    }
}
