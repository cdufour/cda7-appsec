const viciousHeader = (req, res, next) => {
    res.setHeader('X-Powered-By', 'Drupal');
    res.setHeader('X-Langage', 'PHP 7.2');
    next();
}

const banUserAgent = (req, res, next) => {
    const ua = req.get('user-agent'); // retourne la valeur de cet entête HTTP
    if (ua && ua.toLowerCase().indexOf('curl') != -1) {
        return res.send('On ne répond pas à Curl');
    }
    next();
}

module.exports = { viciousHeader, banUserAgent }