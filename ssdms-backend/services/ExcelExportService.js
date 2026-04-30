const XLSX = require('xlsx');
const { pool } = require('../config/database');

/**
 * Generates an Excel workbook buffer for files within optional filters.
 * @param {{ startDate, endDate, stage }} filters
 */
const generateExcelExport = async (filters = {}) => {
    const { startDate, endDate, stage } = filters;

    // Build query with optional filters
    let sql = `
        SELECT 
            f.visit_number, f.patient_name, f.mr_number, f.cnic,
            f.hospital_name, f.admission_date, f.current_stage,
            f.status, f.created_at, f.updated_at, f.created_by
        FROM files f
        WHERE 1=1
    `;
    const params = [];

    if (startDate) { sql += ` AND DATE(f.created_at) >= ?`; params.push(startDate); }
    if (endDate) { sql += ` AND DATE(f.created_at) <= ?`; params.push(endDate); }
    if (stage) { sql += ` AND f.current_stage = ?`; params.push(stage); }

    sql += ` ORDER BY f.created_at DESC`;

    const [files] = await pool.query(sql, params);

    // Fetch movement history for all retrieved files
    const visitNumbers = files.map(f => f.visit_number);
    let movements = [];
    let financeSplits = [];
    let fileComments = [];

    if (visitNumbers.length > 0) {
        const placeholders = visitNumbers.map(() => '?').join(',');

        // 1. Movements
        const [mvRows] = await pool.query(
            `SELECT fm.*, u.name as employee_name
             FROM file_movements fm
             LEFT JOIN users u ON fm.action_by = u.employee_id
             WHERE fm.visit_number IN (${placeholders})
             ORDER BY fm.action_date ASC`,
            visitNumbers
        );
        movements = mvRows;

        // 2. Finance Splits
        const [fsRows] = await pool.query(
            `SELECT * FROM finance_splits WHERE visit_number IN (${placeholders}) ORDER BY created_at ASC`,
            visitNumbers
        );
        financeSplits = fsRows;

        // 3. Internal Comments
        const [fcRows] = await pool.query(
            `SELECT fc.*, u.name as employee_name 
             FROM file_comments fc
             LEFT JOIN users u ON fc.employee_id = u.employee_id
             WHERE fc.visit_number IN (${placeholders}) 
             ORDER BY fc.created_at ASC`,
            visitNumbers
        );
        fileComments = fcRows;
    }

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Sheet 1: Files
    const fileRows = files.map(f => ({
        'Visit Number': f.visit_number,
        'Patient Name': f.patient_name,
        'MR Number': f.mr_number,
        'CNIC': f.cnic,
        'Hospital': f.hospital_name,
        'Admission Date': f.admission_date ? new Date(f.admission_date).toLocaleDateString('en-PK') : '',
        'Current Stage': f.current_stage,
        'Status': f.status,
        'Created By': f.created_by,
        'Created At': new Date(f.created_at).toLocaleString('en-PK'),
        'Last Updated': new Date(f.updated_at).toLocaleString('en-PK'),
    }));
    const ws1 = XLSX.utils.json_to_sheet(fileRows.length ? fileRows : [{ 'Info': 'No records found for the selected filters.' }]);
    XLSX.utils.book_append_sheet(wb, ws1, 'Files');

    // Sheet 2: Movement History
    const movRows = movements.map(m => ({
        'Visit Number': m.visit_number,
        'From Stage': m.from_stage,
        'To Stage': m.to_stage,
        'Action By': `${m.employee_name || 'System'} (${m.action_by})`,
        'Status': m.status,
        'Remarks': m.remarks || '',
        'Date': new Date(m.action_date).toLocaleString('en-PK'),
    }));
    const ws2 = XLSX.utils.json_to_sheet(movRows.length ? movRows : [{ 'Info': 'No movement records found.' }]);
    XLSX.utils.book_append_sheet(wb, ws2, 'Movement History');

    // Sheet 3: Finance Splits
    const splitRows = financeSplits.map(s => ({
        'Visit Number': s.visit_number,
        'Doctor Name': s.doctor_name,
        'Approved Amount': s.approved_amount,
        'Payment Status': s.payment_status,
        'Remarks': s.remarks || '',
        'Approved By': s.approved_by || 'N/A',
        'Date': s.created_at ? new Date(s.created_at).toLocaleString('en-PK') : '',
    }));
    const ws3 = XLSX.utils.json_to_sheet(splitRows.length ? splitRows : [{ 'Info': 'No finance splits found.' }]);
    XLSX.utils.book_append_sheet(wb, ws3, 'Finance Splits');

    // Sheet 4: Internal Comments
    const commentRows = fileComments.map(c => ({
        'Visit Number': c.visit_number,
        'Comment': c.comment_text || c.comment, // Support both common naming conventions
        'Author': `${c.employee_name || 'Unknown'} (${c.employee_id})`,
        'Date': new Date(c.created_at).toLocaleString('en-PK'),
    }));
    const ws4 = XLSX.utils.json_to_sheet(commentRows.length ? commentRows : [{ 'Info': 'No comments found.' }]);
    XLSX.utils.book_append_sheet(wb, ws4, 'Internal Comments');

    // Return as buffer
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
};

module.exports = { generateExcelExport };
