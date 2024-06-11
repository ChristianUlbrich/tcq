import * as bunyan from 'bunyan';
var log = bunyan.createLogger({ name: 'tcq', level: process.env.LOG_LEVEL as bunyan.LogLevel });

export default log;
