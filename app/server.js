const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const mysql = require('mysql');
const PORT = 3100;
const antiBruteForce = require('./middlewares/antiBruteForce');
const { viciousHeader, banUserAgent } = require('./middlewares/general');
const CORRECT_CREDENTIALS = {
    email: 'admin@site.fr',
    password: 1234
};

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
 
// connection.query('SELECT 1 + 1 AS solution', function (error, results, fields) {
//   if (error) throw error;
//   console.log('The solution is: ', results[0].solution);
// });

// const q = "INSERT INTO user (email, password) VALUES ('admin','admin')";
// connection.query(q, (err, results, fields) => {
//     if (err) throw err;
//     console.log(results.insertedId);
// })
 
// connection.end();







// Middlewares

// Accès aux ressources statiques (html,js,css,images, etc...)
app.use(express.static('./public'));

app.use((req, res, next) => {
    res.setHeader('X-Token', 'Dikra est spectaculaire');
    next();
})

// Parsing du corps des requêtes selon l'entête "content-type"
app.use(bodyParser.text()); // content-type:text/plain
app.use(bodyParser.json()); // content-type:application/json
app.use(bodyParser.urlencoded()); // content-type:application/x-www-form-urlencoded

//app.use(viciousHeader);
//app.use(viciousHeader, banUserAgent);
app.use(banUserAgent);

app.get('/', (req, res) => {
    res.send('Salut');
})

app.get('/page1', viciousHeader, (req, res) => {
    res.send('page1');
})

app.post('/login', antiBruteForce, (req, res) => {
    //console.log(req.body);
    
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