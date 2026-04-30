const express = require('express');
const router = express.Router();
const { addComment, getComments } = require('../../controllers/commentController');
const { protect } = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const { commentSchemas, commonSchemas } = require('../../validations');

router.use(protect);

router.post('/:visitNumber/comments',
    validate(commonSchemas.visitNumber, 'params'),
    validate(commentSchemas.add),
    addComment
);

router.get('/:visitNumber/comments',
    validate(commonSchemas.visitNumber, 'params'),
    getComments
);

module.exports = router;
