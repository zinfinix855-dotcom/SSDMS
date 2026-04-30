/**
 * Standardized API Response Helper
 */
const sendSuccess = (res, data, message = 'Operation successful', statusCode = 200) => {
    return res.status(statusCode).json({
        status: 'success',
        message,
        data: data || null
    });
};

const sendError = (res, message = 'Internal Server Error', statusCode = 500, errors = null) => {
    return res.status(statusCode).json({
        status: 'error',
        message,
        errors: errors || null
    });
};

const sendPaginated = (res, data, page, limit, total, message = 'Data retrieved') => {
    return res.status(200).json({
        status: 'success',
        message,
        results: data.length,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
        },
        data
    });
};

module.exports = {
    sendSuccess,
    sendError,
    sendPaginated
};
