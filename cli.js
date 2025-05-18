import { readFile, writeFile } from 'node:fs/promises';
import { convert } from './magic.js';

async function reader(path){
    try {
      const contents = await readFile(path, { encoding: 'utf8' });
        //   console.log(contents)
      return contents;
    } catch (err) {
      console.error(err.message);
    }
}

async function writer(path, content){
    try {
      await writeFile(path, content, { encoding: 'utf8' });
    } catch (err) {
      console.error(err.message);
    }
}


function convertForConsole(convertFunction){
    return async function(filePath){
        const sourceFile = await reader("./systemd-unit.conf");
        const converted = convertFunction(sourceFile);
        await writer("./init.conf", converted.result)
    }
}

async function setup(){
    const convertFunction = convertForConsole(convert)
    convertFunction();
}

setup();