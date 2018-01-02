// @flow
import env from 'node-env-file';
import winston from 'winston';

env('.env');

const Config = ((process.env: any): {
  SLACK_TOKEN: string,
  URL: string,
});

export default Config;
