exports.up = function(knex, Promise) {
  return knex.schema.createTable('linkify', function(table) {
    table.string('slug');
    table.string('url');
    table.string('owner');
    table.string('domain');
    table.string('description');
    table.primary(['slug', 'url']);
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('linkify');
};
