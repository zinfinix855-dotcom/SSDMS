const bcrypt = require('bcrypt');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries in reverse order
  await knex('sla_config').del();
  await knex('workflow_rules').del();
  await knex('users').del();
  await knex('roles').del();

  // 1. Roles
  const roles = await knex('roles').insert([
    { name: 'Admin', permissions: JSON.stringify(['*']) },
    { name: 'Moderator', permissions: JSON.stringify(['view_dashboard', 'search_files', 'export_data']) },
    { name: 'Employee', permissions: JSON.stringify([]) }
  ]).returning('id');

  const adminRoleId = roles[0].id || 1;

  // 2. Default Admin User
  const hashedPassword = await bcrypt.hash('Admin@2026', 10);
  await knex('users').insert({
    employee_id: 'Admin01',
    name: 'System Administrator',
    email: 'admin@ssdms.local',
    password_hash: hashedPassword,
    role_id: adminRoleId,
    assigned_sections: JSON.stringify(['*']),
    is_active: true,
    first_login: false
  });

  // 3. Workflow Rules
  await knex('workflow_rules').insert([
    { from_stage: 'Admission', to_stage: 'Discharge', allowed_roles: JSON.stringify(['Employee', 'Admin']) },
    { from_stage: 'Discharge', to_stage: 'Pre-Approval', allowed_roles: JSON.stringify(['Employee', 'Admin']) },
    { from_stage: 'Pre-Approval', to_stage: 'Approval', allowed_roles: JSON.stringify(['Employee', 'Admin']) },
    { from_stage: 'Approval', to_stage: 'File Verification', allowed_roles: JSON.stringify(['Employee', 'Admin']) },
    { from_stage: 'File Verification', to_stage: 'E-Claim', allowed_roles: JSON.stringify(['Employee', 'Admin']) },
    { from_stage: 'E-Claim', to_stage: 'E-Claim Verification', allowed_roles: JSON.stringify(['Employee', 'Admin']) },
    { from_stage: 'E-Claim Verification', to_stage: 'Finance', allowed_roles: JSON.stringify(['Employee', 'Admin']) },
    { from_stage: 'Finance', to_stage: 'Segregation', allowed_roles: JSON.stringify(['Employee', 'Admin']) },
    { from_stage: 'Segregation', to_stage: 'Indexation', allowed_roles: JSON.stringify(['Employee', 'Admin']) },
    { from_stage: 'Indexation', to_stage: 'Completed', allowed_roles: JSON.stringify(['Admin']) }
  ]);

  // 4. SLA Config
  await knex('sla_config').insert([
    { stage_name: 'Admission', max_hours: 2, escalation_hours: 4, priority_weight: 1.0 },
    { stage_name: 'Discharge', max_hours: 12, escalation_hours: 24, priority_weight: 1.5 },
    { stage_name: 'Pre-Approval', max_hours: 24, escalation_hours: 48, priority_weight: 2.0 },
    { stage_name: 'Approval', max_hours: 24, escalation_hours: 48, priority_weight: 2.0 },
    { stage_name: 'File Verification', max_hours: 6, escalation_hours: 12, priority_weight: 1.2 },
    { stage_name: 'E-Claim', max_hours: 48, escalation_hours: 96, priority_weight: 3.0 },
    { stage_name: 'E-Claim Verification', max_hours: 24, escalation_hours: 48, priority_weight: 2.0 },
    { stage_name: 'Finance', max_hours: 72, escalation_hours: 144, priority_weight: 4.0 },
    { stage_name: 'Segregation', max_hours: 12, escalation_hours: 24, priority_weight: 1.2 },
    { stage_name: 'Indexation', max_hours: 6, escalation_hours: 12, priority_weight: 1.0 }
  ]);
};
