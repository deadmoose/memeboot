// @flow
import knex from 'knex';
import bookshelf from 'bookshelf';

const connection = knex({
  client: 'pg',
  connection: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'memeboot',
    charset: 'utf8',
  },
  debug: true,
});

const orm = bookshelf(connection);

export default orm;
