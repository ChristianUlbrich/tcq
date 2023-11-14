import log from './logger.js';

export const GITHUB_CLIENT_ID = process.env.OAUTH_CLIENT_ID;
export const GITHUB_CLIENT_SECRET = process.env.OAUTH_CLIENT_SECRET;
export const SESSION_SECRET = process.env.SESSION_KEY as string; // Program will exit before use
export const CDB_SECRET = process.env.DB_KEY;

if (!GITHUB_CLIENT_SECRET) {
  log.fatal('ERROR\tNo client secret. Set OAUTH_CLIENT_SECRET.');
  process.exit(1);
}

if (!GITHUB_CLIENT_ID) {
  log.fatal('ERROR\tNo client id. Set OAUTH_CLIENT_ID.');
  process.exit(1);
}

if (!SESSION_SECRET) {
  log.fatal('ERROR\tNo session secret. Set SESSION_KEY.');
  process.exit(1);
}

if (!CDB_SECRET) {
  log.fatal('ERROR\tNo CosmosDB secret. Set DB_KEY.');
  process.exit(1);
}
