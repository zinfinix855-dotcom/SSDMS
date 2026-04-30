/**
 * Baseline Migration for SSDMS Enterprise Schema
 * Consolidates all tables and security enhancements into a single managed migration.
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // 1. Roles
  await knex.schema.createTable('roles', (table) => {
    table.increments('id').primary();
    table.string('name', 50).unique().notNullable();
    table.json('permissions');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // 2. Users
  await knex.schema.createTable('users', (table) => {
    table.string('employee_id', 50).primary();
    table.string('name', 100).notNullable();
    table.string('email', 100).unique().notNullable();
    table.string('password_hash', 255).notNullable();
    table.integer('role_id').unsigned().references('id').inTable('roles').onDelete('RESTRICT').onUpdate('CASCADE');
    table.json('assigned_sections');
    table.boolean('is_active').defaultTo(true);
    table.boolean('first_login').defaultTo(true);
    table.string('refresh_token', 500);
    table.timestamp('last_login');
    table.integer('hospital_id').defaultTo(1);
    table.timestamp('deleted_at').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // 3. Files
  await knex.schema.createTable('files', (table) => {
    table.string('visit_number', 20).primary();
    table.string('ssc_visit_number', 50).unique();
    table.string('patient_name', 255).notNullable(); // Increased for encryption
    table.string('patient_name_bindex', 64);
    table.string('mr_number', 50).notNullable();
    table.string('cnic', 255).notNullable(); // Increased for encryption
    table.string('cnic_bindex', 64);
    table.string('cnic_image_url', 255);
    table.string('hospital_name', 150);
    table.date('admission_date');
    table.enum('current_stage', [
      'Admission', 'Discharge', 'Pre-Approval', 'Approval', 
      'File Verification', 'E-Claim', 'E-Claim Verification', 
      'Finance', 'Segregation', 'Indexation'
    ]).defaultTo('Admission');
    table.enum('status', ['In Progress', 'Completed', 'Objected', 'Returned']).defaultTo('In Progress');
    table.decimal('priority_score', 12, 2).defaultTo(0);
    table.integer('risk_score').defaultTo(0);
    table.integer('predicted_completion_hours');
    table.text('ai_summary');
    table.timestamp('deadline_at');
    table.string('created_by', 50).references('employee_id').inTable('users').onDelete('SET NULL');
    table.integer('hospital_id').defaultTo(1);
    table.timestamp('deleted_at').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.index(['current_stage']);
    table.index(['status']);
    table.index(['mr_number']);
    table.index(['cnic_bindex']);
    table.index(['patient_name_bindex']);
  });

  // 4. File Movements
  await knex.schema.createTable('file_movements', (table) => {
    table.increments('id').primary();
    table.string('visit_number', 20).references('visit_number').inTable('files').onDelete('CASCADE');
    table.string('from_stage', 50);
    table.string('to_stage', 50).notNullable();
    table.string('action_by', 50).references('employee_id').inTable('users');
    table.enum('status', ['Forwarded', 'Returned', 'Overridden']).defaultTo('Forwarded');
    table.text('remarks');
    table.timestamp('action_date').defaultTo(knex.fn.now());
  });

  // 5. Section Entries
  await knex.schema.createTable('section_entries', (table) => {
    table.increments('id').primary();
    table.string('visit_number', 20).references('visit_number').inTable('files').onDelete('CASCADE');
    table.string('stage_name', 50).notNullable();
    table.json('data').notNullable();
    table.string('entered_by', 50).references('employee_id').inTable('users').onDelete('SET NULL');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // 6. Finance Splits
  await knex.schema.createTable('finance_splits', (table) => {
    table.increments('id').primary();
    table.string('visit_number', 20).references('visit_number').inTable('files').onDelete('CASCADE');
    table.string('doctor_name', 100);
    table.decimal('approved_amount', 12, 2);
    table.enum('payment_status', ['Paid', 'Pending']).defaultTo('Pending');
    table.text('remarks');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // 7. Audit Logs
  await knex.schema.createTable('audit_logs', (table) => {
    table.increments('id').primary();
    table.string('employee_id', 50).references('employee_id').inTable('users').onDelete('SET NULL');
    table.string('action', 255).notNullable();
    table.string('target_resource', 100);
    table.string('ip_address', 50);
    table.json('metadata');
    table.string('previous_hash', 64);
    table.string('current_hash', 64);
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // 8. Workflow Rules
  await knex.schema.createTable('workflow_rules', (table) => {
    table.increments('id').primary();
    table.string('from_stage', 50).notNullable();
    table.string('to_stage', 50).notNullable();
    table.json('allowed_roles').notNullable();
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // 9. SLA Config
  await knex.schema.createTable('sla_config', (table) => {
    table.increments('id').primary();
    table.string('stage_name', 50).notNullable().unique();
    table.integer('max_hours').notNullable().defaultTo(24);
    table.integer('escalation_hours').notNullable().defaultTo(48);
    table.decimal('priority_weight', 5, 2).notNullable().defaultTo(1.0);
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // 10. Event Store
  await knex.schema.createTable('event_store', (table) => {
    table.bigIncrements('id').primary();
    table.string('event_type', 100).notNullable();
    table.json('payload').notNullable();
    table.string('visit_number', 20);
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // 11. File Comments
  await knex.schema.createTable('file_comments', (table) => {
    table.increments('id').primary();
    table.string('visit_number', 20).references('visit_number').inTable('files').onDelete('CASCADE');
    table.string('employee_id', 50).references('employee_id').inTable('users').onDelete('SET NULL');
    table.text('comment').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // 12. File Attachments
  await knex.schema.createTable('file_attachments', (table) => {
    table.increments('id').primary();
    table.string('visit_number', 20).references('visit_number').inTable('files').onDelete('CASCADE');
    table.string('employee_id', 50).references('employee_id').inTable('users').onDelete('SET NULL');
    table.string('file_name', 255).notNullable();
    table.string('file_path', 500).notNullable();
    table.bigInteger('file_size').defaultTo(0);
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // 13. Notifications
  await knex.schema.createTable('notifications', (table) => {
    table.increments('id').primary();
    table.string('employee_id', 50).references('employee_id').inTable('users').onDelete('CASCADE');
    table.text('message').notNullable();
    table.boolean('is_read').defaultTo(false);
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // 14. User Sessions (Refresh Token Rotation)
  await knex.schema.createTable('user_sessions', (table) => {
    table.increments('id').primary();
    table.string('user_id', 50).references('employee_id').inTable('users').onDelete('CASCADE');
    table.string('refresh_token', 500).notNullable().index();
    table.string('ip_address', 50);
    table.string('user_agent', 500);
    table.timestamp('expires_at').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  const tables = [
    'user_sessions', 'notifications', 'file_attachments', 'file_comments', 'event_store',
    'sla_config', 'workflow_rules', 'audit_logs', 'finance_splits',
    'section_entries', 'file_movements', 'files', 'users', 'roles'
  ];
  for (const table of tables) {
    await knex.schema.dropTableIfExists(table);
  }
};
