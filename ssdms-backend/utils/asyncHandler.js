/**
 * Wraps an async function and catches any errors to pass them to the next middleware (error handler).
 * @param {Function} fn - The async function to wrap.
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
