function noSqlInjection(str) {
    if (str.indexOf('#') !== -1) return false;
    return true;
}

function isEmail(str) {
    return (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(str)) 
}

function isPasswordValid(str) {
    // conditions
    var c1 = str.length > 9; // longueur d'au moins 10
    var c2 = (/[a-z]+/gm).test(str); // au moins 1 minuscule
    var c3 = (/[A-Z]+/gm).test(str); // au moins 1 majscule
    var c4 = (/[0-9]+/gm).test(str); // au moins 1 chiffre
    return c1 && c2 && c3 && c4;
}

function isFileValid(file) {
    // conditions
    var c1 = file.size < 100000; // 100 ko
    var c2 =  
        file.type == 'image/jpeg' || 
        file.type == 'image/jpg' ||
        file.type == 'image/png' ||
        file.type == 'image/gif';
    return c1 && c2;
}

function purifyInput(str) {
    // remplace par chaîne vide les balises la balise script
    var clean = str
        .toLowerCase()
        .replace('<script>','')
        .replace('</script>', '')
    ;
    return clean;
}

module.exports = { noSqlInjection, isEmail, isPasswordValid, isFileValid, purifyInput };