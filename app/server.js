const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const PORT = 3100;

const viciousHeader = (req, res, next) => {
    res.setHeader('X-Powered-By', 'Drupal');
    next();
}

const banUserAgent = (req, res, next) => {
    const ua = req.get('user-agent');
    //console.log('ua', ua);
    if (ua && ua.toLowerCase().indexOf('curl') != -1) {
        return res.send('On ne répond pas à Curl');
    }
    next();
}

// Middleware
app.use((req, res, next) => {
    res.setHeader('X-Token', 'Dikra est spectaculaire');
    //console.log(req.headers);
    next();
})

app.use(bodyParser.text());
app.use(bodyParser.json()); // parse le body en Json

//app.use(viciousHeader);
//app.use(viciousHeader, banUserAgent);
app.use(banUserAgent);

app.get('/', (req, res) => {
    res.send('Salut');
})

app.get('/page1', viciousHeader, (req, res) => {
    res.send('page1');
})

app.post('/login', (req, res) => {
    console.log(req.body);
    res.send('login');
})

app.disable('x-powered-by') // retire le header de la réponse

app.listen(PORT, () => {
    console.log('Server is running on ' + PORT + '...');
})