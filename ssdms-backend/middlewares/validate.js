const joi = require('joi');

const validate = (schema, property = 'body') => (req, res, next) => {
    const { error } = schema.validate(req[property], {
        abortEarly: false,
        allowUnknown: true,
        stripUnknown: true
    });

    if (error) {
        const errorMessage = error.details
            .map((detail) => detail.message)
            .join(', ');

        return res.status(400).json({
            status: 'fail',
            message: `Validation Error (${property}): ${errorMessage}`
        });
    }

    next();
};

module.exports = validate;
