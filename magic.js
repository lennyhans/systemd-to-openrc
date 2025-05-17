function parseINIString(data) {
    var regex = {
        section: /^\s*\[\s*([^\]]*)\s*\]\s*$/,
        param: /^\s*([^=]+?)\s*=\s*(.*?)\s*$/,
        comment: /^\s*;.*$/
    };
    var value = {};
    var lines = data.split(/[\r\n]+/);
    var section = null;
    lines.forEach(function (line) {
        if (regex.comment.test(line)) {
            return;
        } else if (regex.param.test(line)) {
            var match = line.match(regex.param);
            if (section) {
                value[section][match[1]] = match[2];
            } else {
                value[match[1]] = match[2];
            }
        } else if (regex.section.test(line)) {
            var match = line.match(regex.section);
            value[match[1]] = {};
            section = match[1];
        } else if (line.length == 0 && section) {
            section = null;
        }
    });
    return value;
}

function parseEnvironment(raw) {
    var parts = raw.match(/\S+|"[^"]+"/g)
    console.log(parts);
    var result = {};
    for (var i = 0; i < parts.length; i++) {
        var key = parts[i].substr(0, parts[i].indexOf('='));
        console.log("Key is", key);
        result[key] = parts[i].substr(parts[i].indexOf('=') + 1);
    }
    return result;
}

function validate(parsed) {
    if (!parsed.hasOwnProperty('Service')) {
        return "No [Service] section found";
    }

    if (parsed.Service.hasOwnProperty('EnvironmentFile')) {
        return "Environment= is not supported in openrc";
    }


    return null;
}

function unitToRC(name) {
    var table = {
        "network.target": "net",
        "remote-fs.target": "netmount",
        "nss-lookup.target": "dns"
    }

    if (table.hasOwnProperty(name)) {
        return table[name];
    } else {
        return name.substr(0, name.indexOf('.'));
    }
}

function unitsToRC(units) {
    var names = units.split(/[ ]+/);
    var result = "";
    console.log(names);
    for (var i = 0; i < names.length; i++) {
        result += unitToRC(names[i]) + " ";
    }
    return result;
}

function generateDepend(unit) {
    var depend = "";
    if (unit.Unit.hasOwnProperty('After')) {
        depend += "\tafter " + unitsToRC(unit.Unit.After) + "\n";
    }
    if (unit.Unit.hasOwnProperty('Before')) {
        depend += "\tbefore " + unitsToRC(unit.Unit.Before) + "\n";
    }
    if (unit.Unit.hasOwnProperty('Requires')) {
        depend += "\tneed " + unitsToRC(unit.Unit.Requires) + "\n";
    }
    if (unit.Unit.hasOwnProperty('Wants')) {
        depend += "\tuse " + unitsToRC(unit.Unit.Wants) + "\n";
    }

    if (depend.length > 0) {
        return "\ndepend() {\n" + depend + "}\n";
    }
    return "";
}

function generateSuperviseArgs(unit) {
    var result = "";
    if (unit.Service.hasOwnProperty('WorkingDirectory')) {
        result += ' -d ' + unit.Service.WorkingDirectory;
    }

    if (unit.Service.hasOwnProperty('RootDirectory')) {
        result += ' -r ' + unit.Service.RootDirectory;
    }

    if (unit.Service.hasOwnProperty('UMask')) {
        result += ' -k ' + unit.Service.UMask;
    }

    if (unit.Service.hasOwnProperty('Nice')) {
        result += ' -N ' + unit.Service.Nice;
    }

    if (unit.Service.hasOwnProperty('IOSchedulingClass')) {
        if (unit.Service.hasOwnProperty('IOSchedulingPriority')) {
            result += ' -I ' + unit.Service.IOSchedulingClass + ":" + unit.Service.IOSchedulingPriority;
        } else {
            result += ' -I ' + unit.Service.IOSchedulingClass;
        }
    }

    if (unit.Service.hasOwnProperty('StandardOutput')) {
        if (unit.Service.StandardOutput.substr(0, 5) === "file:") {
            result += ' -1 ' + unit.Service.StandardOutput.substr(5);

            if (!unit.Service.hasOwnProperty('StandardError')) {
                unit.Service.StandardError = unit.Service.StandardOutput;
            }
        }
    }

    if (unit.Service.hasOwnProperty('StandardError')) {
        if (unit.Service.StandardError.substr(0, 5) === "file:") {
            result += ' -2 ' + unit.Service.StandardError.substr(5);
        }
    }

    if (unit.Service.hasOwnProperty('Environment')) {
        var env = parseEnvironment(unit.Service.Environment);
        for (var key in env) {
            if (env.hasOwnProperty(key)) {
                result += ' -e ' + key + '=\\"' + env[key] + '\\"';
                console.log(key, env[key]);
            }
        }
    }

    if (result.length > 0) {
        return 'supervise_daemon_args="' + result + '"\n';
    } else {
        return '';
    }
}


function generateSSDArgs(unit) {
    var result = "";
    if (unit.Service.hasOwnProperty('WorkingDirectory')) {
        result += ' -d ' + unit.Service.WorkingDirectory;
    }

    if (unit.Service.hasOwnProperty('RootDirectory')) {
        result += ' -r ' + unit.Service.RootDirectory;
    }

    if (unit.Service.hasOwnProperty('UMask')) {
        result += ' -k ' + unit.Service.UMask;
    }

    if (unit.Service.hasOwnProperty('Nice')) {
        result += ' -N ' + unit.Service.Nice;
    }

    if (unit.Service.hasOwnProperty('IOSchedulingClass')) {
        if (unit.Service.hasOwnProperty('IOSchedulingPriority')) {
            result += ' -I ' + unit.Service.IOSchedulingClass + ":" + unit.Service.IOSchedulingPriority;
        } else {
            result += ' -I ' + unit.Service.IOSchedulingClass;
        }
    }

    if (unit.Service.hasOwnProperty('CPUSchedulingPolicy')) {
        if (unit.Service.hasOwnProperty('CPUSchedulingPriority')) {
            result += ' -I ' + unit.Service.CPUSchedulingPolicy + ":" + unit.Service.CPUSchedulingPriority;
        } else {
            result += ' -I ' + unit.Service.CPUSchedulingPolicy;
        }
    }

    if (result.length > 0) {
        return 'start_stop_daemon_args="' + result + '"\n';
    } else {
        return '';
    }
}

function generateForking(unit) {
    var cmd = unit.Service.ExecStart;
    var pidfile = unit.Service.PIDFile;
    var executable = cmd.substr(0, cmd.indexOf(' '));
    var args = cmd.substr(cmd.indexOf(' ') + 1);
    var result = "";
    result += 'command="' + executable + '"\n';
    result += 'command_args="' + args + '"\n';
    result += 'pidfile="' + pidfile + '"\n';
    return result;
}

function generateSimple(unit) {
    var cmd = unit.Service.ExecStart;
    var executable = cmd.substr(0, cmd.indexOf(' '));
    var args = cmd.substr(cmd.indexOf(' ') + 1);
    var result = "";
    result += 'supervisor="supervise-daemon"\n';
    result += 'command="' + executable + '"\n';
    result += 'command_args="' + args + '"\n';
    return result;
}

function generateOneshot(unit) {
    var cmd = unit.Service.ExecStart;
    var executable = cmd.substr(0, cmd.indexOf(' '));
    var args = cmd.substr(cmd.indexOf(' ') + 1);
    var result = "";
    result += 'command="' + executable + '"\n';
    result += 'command_args="' + args + '"\n';
    return result;
}

function generateUser(unit) {
    if (unit.Service.hasOwnProperty('User')) {
        if (unit.Service.hasOwnProperty('Group')) {
            return 'command_user="' + unit.Service.User + ':' + unit.Service.Group + '"\n'
        } else {
            return 'command_user="' + unit.Service.User + '"\n'
        }
    }
    return "";
}

function generateStop(unit) {
    if (!unit.Service.hasOwnProperty('ExecStop')) {
        return "";
    }

    var result = "\nstop() {\n";
    result += '\tebegin "Stopping $RC_SVCNAME"\n';
    result += '\t' + unit.Service.ExecStop + '\n';
    result += '\teend $?\n';
    result += "}\n";
    return result;
}

function generateReload(unit) {
    if (!unit.Service.hasOwnProperty('ExecReload')) {
        return "";
    }

    var result = "\nreload() {\n";
    result += '\tebegin "Reloading $RC_SVCNAME"\n';
    result += '\t' + unit.Service.ExecReload + '\n';
    result += '\teend $?\n';
    result += "}\n";
    return result;
}


function convert(event) {
    event.preventDefault();
    var raw = document.getElementById('unit').value;
    var parsed = parseINIString(raw);
    var validated = validate(parsed);
    if (validated !== null) {
        document.getElementById('error').innerHTML = validated;
        return;
    } else {
        document.getElementById('error').innerHTML = '';
    }
    console.log(parsed);

    var result = '#!/sbin/openrc-run\n\nname=$RC_SVCNAME\ndescription="' + parsed.Unit.Description + '"\n';

    if (!parsed.Service.hasOwnProperty('Type')) {
        var type = 'simple';
    } else {
        var type = parsed.Service.Type;
    }
    console.log("Generating " + type + " unit");
    switch (type) {
        case "simple":
        case "exec":
            result += generateSimple(parsed);
            result += generateSuperviseArgs(parsed);
            break;
        case "oneshot":
            result += generateOneshot(parsed);
            result += generateSSDArgs(parsed);
            break;
        case "forking":
            result += generateForking(parsed);
            result += generateSSDArgs(parsed);
            break;
    }
    result += generateUser(parsed);
    result += generateDepend(parsed);
    result += generateStop(parsed);
    result += generateReload(parsed);

    document.getElementById('openrc').innerText = result;
}

document.addEventListener("DOMContentLoaded", function () {
    document.getElementById('convert').addEventListener('click', convert);
});