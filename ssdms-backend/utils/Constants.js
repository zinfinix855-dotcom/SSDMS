const STAGES = [
    'Admission',
    'Discharge',
    'Pre-Approval',
    'Approval',
    'File Verification',
    'E-Claim',
    'E-Claim Verification',
    'Finance',
    'Segregation',
    'Indexation'
];



const STATUS = {
    IN_PROGRESS: 'In Progress',
    COMPLETED: 'Completed',
    OBJECTED: 'Objected',
    RETURNED: 'Returned',
    ARCHIVED: 'Archived'
};

module.exports = {
    STAGES,
    STATUS
};
