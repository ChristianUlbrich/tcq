import * as secrets from './secrets';
// important that this block come very early as appinsights shims many things

import log from './logger';
import * as express from 'express';
import passport from './passport';
import routes from './router';
import * as socketio from 'socket.io';
import { Server } from 'http';
import * as Session from 'express-session';
import socketHandler from './socket-hander';
import * as bodyParser from 'body-parser';

const app = express();
const server = new Server(app as any); // this seems to work, and I see docs about it, but typings complain
const io = socketio(server, { perMessageDeflate: false });
const port = process.env.PORT || 3000;
log.info('Starting server');
server.listen(port, function () {
  log.info('Application started and listening on port ' + port);
});

function getSessionStoreForSession(session: any) {
  if (process.env['TCQ_SESSION_STORE_ADAPTER'] === 'cosmos-db') {
    const { createSessionStoreForSession } = require('./adapters/session-store/cosmos-db.session-store.adapter');
    return {
      store: createSessionStoreForSession(session)
    }
  } else {
    return {
      // if no sessionStore adapter is provided, return an empty object, because this
      // will later on default to the built-in memory store
    }
  }
}

const session = Session({
  secret: secrets.SESSION_SECRET,
  ...{...getSessionStoreForSession(Session)},
  resave: true,
  saveUninitialized: true
});

app.use(function requireHTTPS(req, res, next) {
  if (req.get('x-site-deployment-id') && !req.get('x-arr-ssl')) {
    return res.redirect('https://' + req.get('host') + req.url);
  }

  next();
});

app.use(function (req, res, next) {
  next();
});
app.use(require('express-bunyan-logger')());
app.use(bodyParser.json());
app.use(session);
app.use(passport.initialize());
app.use(passport.session());
app.use(routes);
app.use(express.static('dist/client/'));

io.use(function (socket, next) {
  var req = socket.handshake;
  var res = {};
  session(req as any, res as any, next);
});
io.on('connection', socketHandler);

export default app;
