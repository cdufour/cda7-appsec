function noSqlInjection(str) {

    if (str.indexOf('#') !== -1) {
        return false;
    }

    return true;
}

module.exports = { noSqlInjection };