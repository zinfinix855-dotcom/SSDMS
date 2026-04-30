const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../../middlewares/auth');
const { generateExcelExport } = require('../../services/ExcelExportService');

// @desc    Export files to Excel
// @route   GET /api/export/excel
// @access  Private (Admin, Moderator)
router.get('/excel', protect, restrictTo('Admin', 'Moderator'), async (req, res) => {
    try {
        const { start_date, end_date, stage } = req.query;
        const buffer = await generateExcelExport({ startDate: start_date, endDate: end_date, stage });

        const filename = `SSDMS_Export_${new Date().toISOString().slice(0, 10)}.xlsx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(buffer);
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to generate export.' });
    }
});

module.exports = router;
