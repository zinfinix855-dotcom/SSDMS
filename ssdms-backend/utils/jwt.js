const jwt = require('jsonwebtoken');
const config = require('../config/env');

const generateToken = (payload) => {
    return jwt.sign(payload, config.jwtSecret, {
        expiresIn: config.jwtExpiresIn,
    });
};

const generateRefreshToken = (payload) => {
    return jwt.sign(payload, config.jwtRefreshSecret, {
        expiresIn: config.jwtRefreshExpiresIn,
    });
};

const verifyToken = (token) => {
    return jwt.verify(token, config.jwtSecret);
};

const verifyRefreshToken = (token) => {
    return jwt.verify(token, config.jwtRefreshSecret);
};

module.exports = {
    generateToken,
    generateRefreshToken,
    verifyToken,
    verifyRefreshToken
};
