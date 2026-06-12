/**
 * Enforce hospital_id Integrity
 * Sets hospital_id to NOT NULL for users and files tables.
 * @param { import("knex").Knex } knex
 */
exports.up = async function(knex) {
  // 1. Clean up any accidental NULLs (Baseline safety)
  await knex('users').whereNull('hospital_id').update({ hospital_id: 1 });
  await knex('files').whereNull('hospital_id').update({ hospital_id: 1 });

  // 2. Alter users table
  await knex.schema.alterTable('users', (table) => {
    table.integer('hospital_id').notNullable().defaultTo(1).alter();
  });

  // 3. Alter files table
  await knex.schema.alterTable('files', (table) => {
    table.integer('hospital_id').notNullable().defaultTo(1).alter();
  });
};

exports.down = async function(knex) {
  await knex.schema.alterTable('users', (table) => {
    table.integer('hospital_id').nullable().defaultTo(1).alter();
  });

  await knex.schema.alterTable('files', (table) => {
    table.integer('hospital_id').nullable().defaultTo(1).alter();
  });
};
