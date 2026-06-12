const express = require('express');
const router = express.Router();
const { protect } = require('../../middlewares/auth');

const HOSPITALS = [
    { id: 1, name: 'Sehat Sahulat Apex Hospital' },
    { id: 2, name: 'Khyber Teaching Hospital' },
    { id: 3, name: 'Lady Reading Hospital' }
];

router.get('/', protect, (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        // For Admin: return all hospitals.
        if (user.role_name === 'Admin') {
            return res.status(200).json({
                success: true,
                data: HOSPITALS
            });
        }

        // For other users: return only their assigned hospital
        const assignedHospitalId = user.hospital_id || 1;
        const matchedHospital = HOSPITALS.find(h => h.id === assignedHospitalId) || {
            id: assignedHospitalId,
            name: `Hospital #${assignedHospitalId}`
        };

        return res.status(200).json({
            success: true,
            data: [matchedHospital]
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error fetching hospitals',
            error: error.message
        });
    }
});

module.exports = router;
