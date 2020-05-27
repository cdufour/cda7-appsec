const { rename } = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const mysql = require('mysql');
const bcrypt = require('bcrypt');

const formidable = require('formidable');
const uniqueString = require('unique-string');
const session = require('express-session');

const PORT = 3100;
const antiBruteForce = require('./middlewares/antiBruteForce');
const { viciousHeader, banUserAgent } = require('./middlewares/general');
const { noSqlInjection, isEmail, isPasswordValid, isFileValid, purifyInput } = require('./security');
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

// Middleware gérant la session (module express-session)
app.use(session({secret:'juve', resave: false})) // ajoute la clé .session à l'objet req

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
    let q = "SELECT id, password FROM user WHERE email = ?"; // requête préparée
    q = mysql.format(q, [email]); // .format() échappe - sécurise - les paramètres
    connection.query(q, (err, result) => {
        if (result.length === 0) return res.send('Login failed...');
        const hash = result[0].password;
        const userId = result[0].id;


        // comparaison du password clair avec le password crypté
        bcrypt.compare(password, hash, (err, same) => {
            if (same) {
                req.session.connected = true;
                req.session.userId = userId;
                console.log(req.session);
                res.send('LOGIN OK');
            } else {
                res.send('LOGIN NOT OK');
            }
        })

    })
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

app.post('/upload', (req, res) => {
    const form = formidable({ multiples: true });
 
    form.parse(req, (err, fields, files) => {
        if (err) {
            next(err);
            return;
        }
        // Checkpoints
        if(!isFileValid(files.file)) return res.send('Invalid file');

        // validation ok => enregistrement du fichier
        var ustr = uniqueString();
        var ext = files.file.name.split('.')[1];
        var dest = __dirname + '/public/upload/' + ustr + '.' + ext;
        rename(files.file.path, dest, (err) => {
            if (err) return res.send('Cannot save file')
            res.send('File uploaded');
        })
    });
})

app.get('/newpassword', (req, res) => {
    if (!req.session.connected) return res.status(401).send('Not allowed');

    const token = uniqueString();
    req.session.token = token;
    var body = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Modify Password</title>
    </head>
    <body>
        <h1>Modify Password</h1>
        <form method="POST" action="/newpassword" enctype="application/x-www-form-urlencoded">
            <input name="token" type="hidden" value="${token}" />
            <input name="new_password" type="password" placeholder="New password" /><br>
            <input name="confirm_password" type="password" placeholder="Confirm password" /><br>
            <input name="submit" type="submit" value="Change password" />
        </form>
    </body>
    </html>`;

    res.send(body);
})

app.post('/newpassword', (req, res) => {
    if (!req.session.connected) return res.status(401).send('Not allowed');
    
    // vérification du token anti-csrf
    // token absent de la session
    if (!req.session.token) return res.status(401).send('Not allowed');

    // token présent dans la session mais différent de celui reçu dans la requête
    if (req.session.token != req.body.token) return res.status(401).send('Not allowed');

    // requête SQL ici pour modifier le mot de passe
    res.send('Password modified');
})

app.get('/test', (req, res) => {
    if (!req.session.connected) return res.status(401).send('Not allowed');
    res.send('ok');
})

app.get('/xss-reflected', (req, res) => {

    // Dans cette faille, le serveur renvoie directement un input du client
    // cet input peut contenir du code (balises, script) éxecutable par son navigateur
    // Contre-mesure: nettoyer les inputs, avant leur renvoie (reflected) ou insertion en base (store) !
    // https://www.npmjs.com/package/sanitize-html

    var message = (req.query.message) ? req.query.message : '';
    var body = `
        <body>
        <h1>XSS Reflected</h1>
        <form>
            <input type="text" name="message" />
            <input type="submit" value="Send" />
        </form>
        <p>${message}</p>
        </body>
    `;
    res.send(body);

})

app.get('/message', (req, res) => {
    var q = 'SELECT * FROM message';
    connection.query(q, (err, results) => {
        var messages = '';
        if (results.length > 0) {
            messages += '<ul>';
            results.forEach(r => {
                messages += '<li>' + r.body + '</li>';
            })
            messages += '</ul>';
        }

        var form = `
            <form method="POST" action="/message">
                <input type="text" name="message" />
                <input type="submit" value="Send" />
            </form>
        `;
        var body = `
            <h1>Messages</h1>
            <div>${form}</div>
            <div>${messages}</div>
        `;

        res.send(body);
    })

})

app.post('/message', (req, res) => {
    var { userId, connected } = req.session;
    if (!connected || !userId) return res.status(401).send('Not allowed');

    var message = purifyInput(req.body.message);
    
    var q = "INSERT INTO message (userId, body) VALUES (?,?)";
    q = mysql.format(q, [userId, message]);
    connection.query(q, (err, result) => {
        res.redirect('/message');
    })
})

app.disable('x-powered-by') // retire le header de la réponse


app.listen(PORT, () => {
    console.log('Server is running on ' + PORT + '...');
})