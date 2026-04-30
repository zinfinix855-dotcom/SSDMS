/**
 * Catches errors in async functions and passes them to the global error handler
 */
module.exports = fn => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
