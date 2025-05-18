#!/usr/bin/env node

import { readFile, writeFile, stat } from 'node:fs/promises';
import { argv, exit } from 'node:process';
import { convert } from './magic.js';

async function reader(path) {
    try {
        const preFlighCheck = await stat(path);
        const isUsable = preFlighCheck.isFile() && !preFlighCheck.isDirectory()
        if (!isUsable)
            return "";
        const contents = await readFile(path, { encoding: 'utf8' });
        return contents;
    } catch (err) {
        console.error(err.message);
    }
}

async function writer(path, content) {
    try {
        const preFlighCheck = await stat(path);
        const isUsable = preFlighCheck.isFile() && !preFlighCheck.isDirectory()
        if (!isUsable)
            return;
        await writeFile(path, content, { encoding: 'utf8' });
    } catch (err) {
        console.error(err.message);
    }
}


function convertForConsole(convertFunction) {
    return async function (filePath) {
        const sourceFile = await reader(filePath);
        const converted = convertFunction(sourceFile);
        await writer("./init.conf", converted.result)
    }
}

async function setup(input, output) {
    const convertFunction = convertForConsole(convert)
    convertFunction(input);
}

const [, , input, output] = argv;

// print process.argv
// argv.forEach((val, index) => {
//   console.log(`${index}: ${val}`);
// });
// exit(0);
if (input === "-h" || input === '--help' || argv.length < 3) {
    console.info(`
Convert systemd service unit to openrc

    usage: 
cli.js <input-systemd-unit> <output-init-file> 

    example: 
cli.js systemd.unit init.conf
`)
    exit();
}
setup(input, output);