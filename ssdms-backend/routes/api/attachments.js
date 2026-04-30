const express = require('express');
const router = express.Router();
const attachmentController = require('../../controllers/attachmentController');
const { protect } = require('../../middlewares/auth');
const { upload } = require('../../middlewares/upload');
const { validateFileMagicBytes } = require('../../middlewares/fileValidator');

router.use(protect);

router.post('/:visitNumber/upload', upload.single('attachment'), validateFileMagicBytes, attachmentController.uploadAttachment);
router.get('/:visitNumber/attachments', attachmentController.getAttachments);

module.exports = router;
