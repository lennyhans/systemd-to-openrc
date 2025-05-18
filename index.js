import { convert } from './magic.js'

function convertForBrowser (convertFunction){
    return function(event){
        event.preventDefault();
        const raw = document.getElementById('unit').value;

        const response = convertFunction(raw)
        const validated = response.validated;
        const result = response.result;
        if (validated !== null) {
            document.getElementById('error').innerHTML = validated;
            return;
        } else {
            document.getElementById('error').innerHTML = '';
        }
        document.getElementById('openrc').innerText = result;

    }
}

function setup(){
    if(typeof window !== "undefined" && typeof window.document !== "undefined"){
        const convertFunction = convertForBrowser(convert)
        document.addEventListener("DOMContentLoaded", function () {
        document.getElementById('convert').addEventListener('click', convertFunction);
    });
    }
}

setup();
