
const fileService = require("fs");

if (process.argv[2] === undefined) {
    throw new Error("You must pass a target name");
}

const resolveFile = target => {
    let oldLines = 0;
    let newLines = 0;

    fileService.readFile(target,"utf8",(_,content)=>{
        let isDevCode = false;
        const parts = content.split("\n");
        oldLines = parts.length;
        const newContent = parts.reduce((a,b)=>{
            if (b.includes("// -- Development only --")) {
                isDevCode = true;
            }
            else if (b.includes("// /-- Development only --")) {
                isDevCode = false;
                return a;
            }
            if (!isDevCode) {
                a.push(b);
            }
            return a;
        },[]);

        newLines = newContent.length;

        fileService.writeFile(target,newContent.join("\n"),()=>{
            console.log(`File written: ${target}. Old lines: ${oldLines}. New lines: ${newLines}`);
        });
    });
}

const cloneFolder = (dir,newDir,safetyRecursionCatch=1) => {
    const dirs = fileService.readdirSync(dir).filter(x=>!x.includes("."));
    const files = fileService.readdirSync(dir).filter(x=>x.includes("."));
    dirs.forEach(x=>{
        if (x === "goose" || x === "_archive") {
            return;
        }
        fileService.mkdirSync(newDir + "/" + x);
        console.log("Exists: ", newDir + "/" + x, fileService.existsSync(newDir + "/" + x));
        if (safetyRecursionCatch <= 20) {
            cloneFolder(dir + "/" + x, newDir + "/" + x,++safetyRecursionCatch);
        }
    });
    files.forEach(x=>{
        fileService.readFile(dir + "/" + x,"utf8",(_,content)=>
            fileService.writeFile(newDir + "/" + x,content,()=>{
                resolveFile(newDir + "/" + x)
            }));
    });
}

const location = process.argv[2];

fileService.mkdirSync(location + "/goose");

cloneFolder(location, location + "/goose");
