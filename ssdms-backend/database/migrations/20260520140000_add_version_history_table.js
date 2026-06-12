/**
 * Create workbook_versions table for tracking section entry versions
 * @param { import("knex").Knex } knex
 */
exports.up = async function(knex) {
  await knex.schema.createTable('workbook_versions', (table) => {
    table.increments('id').primary();
    table.string('visit_number', 20).references('visit_number').inTable('files').onDelete('CASCADE');
    table.string('stage_name', 50).notNullable();
    table.integer('version_number').notNullable();
    table.json('data').notNullable();
    table.string('changed_by', 50).references('employee_id').inTable('users').onDelete('SET NULL');
    table.string('change_type', 20).notNullable().defaultTo('update');
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index(['visit_number']);
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('workbook_versions');
};
