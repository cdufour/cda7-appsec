const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const PORT = 3100;
const CORRECT_CREDENTIALS = {
    email: 'admin@site.fr',
    password: 1234
};

const viciousHeader = (req, res, next) => {
    res.setHeader('X-Powered-By', 'Drupal');
    next();
}

const banUserAgent = (req, res, next) => {
    const ua = req.get('user-agent'); // retourne la valeur de cet entête HTTP
    //console.log('ua', ua);
    if (ua && ua.toLowerCase().indexOf('curl') != -1) {
        return res.send('On ne répond pas à Curl');
    }
    next();
}




// Middlewares

// Accès aux ressources statiques (html,js,css,images, etc...)
app.use(express.static('public'));

app.use((req, res, next) => {
    res.setHeader('X-Token', 'Dikra est spectaculaire');
    //console.log(req.headers);
    next();
})

app.use(bodyParser.text()); // Content-Type:text/plain
app.use(bodyParser.json()); // parse le body en Json
app.use(bodyParser.urlencoded());

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
    
    // vérifications
    const {email, password} = req.body;
    if (email == CORRECT_CREDENTIALS.email &&
        password == CORRECT_CREDENTIALS.password) {
        
        res.status(200).send('Login OK');
    } else {
        // On pourrait renvoyer, par exemple, un status code
        // indiquant l'erreur d'identification
        // mais cela donnerait une info exploitable lors
        // d'une attaque par force brute par exemple
        // Bonne pratique: code 200 quelque-soit l'issue
        // de l'authentification
        res.status(200).send('Login NOT OK');
    }
})

app.disable('x-powered-by') // retire le header de la réponse

app.listen(PORT, () => {
    console.log('Server is running on ' + PORT + '...');
})