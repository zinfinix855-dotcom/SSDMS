const Joi = require('joi');
const { STAGES, STATUS } = require('../utils/Constants');

const authSchemas = {
    login: Joi.object({
        authId: Joi.string().required().messages({
            'string.empty': 'Employee ID / Auth ID is required'
        }),
        password: Joi.string().required().messages({
            'string.empty': 'Password is required'
        })
    })
};

const admissionSchemas = {
    create: Joi.object({
        ssc_visit_number: Joi.string().pattern(/^SSC-\d{6,12}$/).required().messages({
            'string.pattern.base': 'SSC Visit Number must be in SSC-123456 format'
        }),
        patient_name: Joi.string().min(3).max(100).required(),
        mr_number: Joi.string().required(),
        cnic: Joi.string().pattern(/^\d{5}-?\d{7}-?\d{1}$/).required().messages({
            'string.pattern.base': 'CNIC must be in 12345-1234567-1 format'
        }),
        hospital_name: Joi.string().required(),
        cnic_image_url: Joi.string().allow('', null).optional()
    })
};

const workflowSchemas = {
    forward: Joi.object({
        visit_number: Joi.string().required(),
        current_stage: Joi.string().valid(...STAGES).required(),
        data: Joi.object().optional(),
        remarks: Joi.string().max(1000).allow('', null).optional()
    }),
    return: Joi.object({
        visit_number: Joi.string().required(),
        return_to_stage: Joi.string().valid(...STAGES).required(),
        remarks: Joi.string().max(1000).required().messages({
            'any.required': 'Remarks are mandatory when returning a file'
        })
    }),
    override: Joi.object({
        visit_number: Joi.string().required(),
        target_stage: Joi.string().valid(...STAGES).required(),
        reason: Joi.string().min(5).required()
    }),
    bulk: Joi.object({
        visit_numbers: Joi.array().items(Joi.string()).min(1).required(),
        action: Joi.string().valid(...Object.values(STATUS)).required(),
        remarks: Joi.string().allow('', null).optional()
    })
};

const userSchemas = {
    create: Joi.object({
        employee_id: Joi.string().required(),
        name: Joi.string().required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
        role_id: Joi.number().integer().required(),
        assigned_sections: Joi.array().items(Joi.string().valid(...STAGES)).optional()
    }),
    update: Joi.object({
        name: Joi.string().optional(),
        email: Joi.string().email().optional(),
        role_id: Joi.number().integer().optional(),
        assigned_sections: Joi.array().items(Joi.string().valid(...STAGES)).optional(),
        is_active: Joi.boolean().optional()
    })
};

const commonSchemas = {
    visitNumber: Joi.object({
        visitNumber: Joi.string().required()
    })
};

const commentSchemas = {
    add: Joi.object({
        comment: Joi.string().min(1).max(1000).required()
    })
};

module.exports = {
    authSchemas,
    admissionSchemas,
    workflowSchemas,
    userSchemas,
    commonSchemas,
    commentSchemas
};
