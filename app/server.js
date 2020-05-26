const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const PORT = 3100;
const antiBruteForce = require('./middlewares/antiBruteForce');
const { viciousHeader, banUserAgent } = require('./middlewares/general');
const { noSqlInjection, isEmail, isPasswordValid } = require('./security');
const CORRECT_CREDENTIALS = { email: 'admin@site.fr', password: 1234 };

const connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : 'root',
    database : 'appsec',
    port     : 8889
});
 
connection.connect((err) => {
    if (err) {
        console.log(err);
    } else {
        console.log('Connected to Mysql');
    }
    
});
 

// ** Middlewares **
// Middleware donnant accès aux ressources statiques (html,js,css,images, etc...)
app.use(express.static('./public'));

// Middleware personnalisé agissant sur toutes les requêtes, ajoute un token dans les entêtes
app.use((req, res, next) => {
    res.setHeader('X-Token', 'Dikra est spectaculaire');
    next();
})

// Middlewares pour "parser" le corps des requêtes selon l'entête "content-type"
app.use(bodyParser.text()); // content-type:text/plain
app.use(bodyParser.json()); // content-type:application/json
app.use(bodyParser.urlencoded()); // content-type:application/x-www-form-urlencoded

// Middleware inspectant l'entête user-agent
app.use(banUserAgent);


// ** Routes **
app.get('/', (req, res) => {
    res.send('Salut');
})

app.get('/page1', viciousHeader, (req, res) => {
    res.send('page1');
})

app.post('/login', antiBruteForce, (req, res) => {
    
    // vérifications
    const {email, password} = req.body;

    // if (email == CORRECT_CREDENTIALS.email &&
    //     password == CORRECT_CREDENTIALS.password) {
        
    //     res.status(200).send('Login OK');
    // } else {
    //     // On pourrait renvoyer, par exemple, un status code indiquant l'erreur d'identification
    //     // mais cela donnerait une info exploitable lors d'une attaque par force brute par exemple
    //     // Bonne pratique: code 200 quelque-soit l'issue de l'authentification
    //     res.status(200).send('Login NOT OK');
    // }

    if (!noSqlInjection(email)) return res.send('Character illicit !');
    
    // Interrogation de la base de données
    // Requête non préparée, par concaténation avec les inputs => dangereux
    // const q = `SELECT * FROM user WHERE email = '${email}' AND password = '${password}'`;

    // Bonne pratique: requêtes préparées
    // https://www.npmjs.com/package/mysql#escaping-query-values
    let q = "SELECT password FROM user WHERE email = ?"; // requête préparée
    q = mysql.format(q, [email]); // .format() échappe - sécurise - les paramètres

    connection.query(q, (err, result) => {
        if (result.length === 0) return res.send('Login failed...');

        hash = result[0].password;

        // comparaison du password clair avec le password crypté
        bcrypt.compare(password, hash, (err, same) => {
            if (same) {
                res.send('LOGIN OK')
            } else {
                res.send('LOGIN NOT OK');
            }
        })

    })

    //res.send('...');

    });


app.post('/user', (req, res) => {
    const { email, password } = req.body;

    // checkpoints
    if (!isEmail(email)) return res.send('Email not correct');
    if (!isPasswordValid(password)) return res.send('Password not correct');
    if (!noSqlInjection(email) || !noSqlInjection(password)) return res.send('Illicit chars');
    
    // encryptage (hash + salt) du password
    bcrypt.hash(password, 8, (err, hash) => {
        
        // insertion en db
        let q = "INSERT INTO user (email, password) VALUES (?,?)";
        q = mysql.format(q, [email, hash]);
        connection.query(q, (err, result) => {
            console.log(result);
        })

    });

    res.send('ok');

})

app.disable('x-powered-by') // retire le header de la réponse


app.listen(PORT, () => {
    console.log('Server is running on ' + PORT + '...');
})