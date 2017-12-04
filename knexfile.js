const env = require('node-env-file');

env(`.env`);

module.exports = {
  development: {
    client: 'postgresql',
    connection: {
      database: 'memeboot',
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    },
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      tableName: 'knex_migrations',
    },
  },
};
