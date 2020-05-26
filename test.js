const { exec } = require('child_process');

exec('ping localhost -c 1', (err, out) => {
    console.log(out);
});