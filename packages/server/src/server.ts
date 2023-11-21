import * as secrets from './secrets.js';
import log from './logger.js';
import express from 'express';
import passport from './passport.js';
import routes from './router.js';
import { Server as socketio } from 'socket.io';
import { Server } from 'http';
import Session from 'express-session';
import createMemoryStore from 'memorystore';
import socketHandler from './socket-hander.js';
import bodyParser from 'body-parser';
import bunyan from 'express-bunyan-logger';

const app = express();
const server = new Server(app as any); // this seems to work, and I see docs about it, but typings complain
const io = new socketio(server, { perMessageDeflate: false });

const port = process.env.PORT;
if (!port) {
  log.fatal('ERROR\tNo server port. Set PORT.');
  process.exit(1);
}

log.info('Starting server');
server.listen(port, function () {
  log.info('Application started and listening on port ' + port);
});

const MemoryStore = createMemoryStore(Session);
const session = Session({
  resave: true,
  saveUninitialized: true,
  secret: secrets.SESSION_SECRET,
  store: new MemoryStore({ checkPeriod: 86400000 })
}); // prune expired entries every 24h from the store

app.set('query parser', 'simple');

app.use(function requireHTTPS(req, res, next) {
  if (req.get('x-site-deployment-id') && !req.get('x-arr-ssl')) {
    return res.redirect('https://' + req.get('host') + req.url);
  }

  next();
});

app.use(bunyan());
app.use(bodyParser.json());
app.use(session);
app.use(passport.initialize());
app.use(passport.session());
app.use(routes);

io.use(function (socket, next) {
  var req = socket.handshake;
  var res = {};
  session(req as any, res as any, next);
});
io.on('connection', socketHandler);

export default app;
