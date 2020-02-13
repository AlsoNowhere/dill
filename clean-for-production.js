
const fileService = require("fs");

if (process.argv[2] === undefined) {
    throw new Error("You must pass a target name");
}

const removeFolder = dir => {
    const dirs = fileService.readdirSync(dir).filter(x=>!x.includes("."));
    const files = fileService.readdirSync(dir).filter(x=>x.includes("."));
    files.forEach(x=>{
        fileService.unlinkSync(dir + "/" + x);
    });
    dirs.forEach(x=>{
        removeFolder(dir + "/" + x);
        fileService.rmdirSync(dir + "/" + x);
    });
}

const location = process.argv[2];

removeFolder(location + "/goose");
fileService.rmdirSync(location + "/goose");
