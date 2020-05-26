// Middleware express destiné à bloquer une attaque par force brute

const MAX_LOGIN_ATTEMPTS = 3; // nombre de tentatives de login autorisé
let hosts = {}; // objet mémorisant les hosts effectuant des requêtes sur /login

const antiBruteForce = (req, res, next) => {
    let attempts = hosts[req.hostname];

    if (!attempts) {
        hosts[req.hostname] = 1;
    } else {
        hosts[req.hostname] += 1;
    }
    
    if (hosts[req.hostname] > MAX_LOGIN_ATTEMPTS) {
        return res.send('VOus avez dépassé le nombre de tentatives autorisées');
    }

    next();
}

module.exports = antiBruteForce;