import * as secrets from './secrets';
import log from './logger';
import * as express from 'express';
import passport from './passport';
import routes from './router';
import { Server as socketio } from 'socket.io';
import { Server } from 'http';
import * as Session from 'express-session';
import socketHandler from './socket-hander';
import * as bodyParser from 'body-parser';

const app = express();
const server = new Server(app as any); // this seems to work, and I see docs about it, but typings complain
const io = new socketio(server, { perMessageDeflate: false });
const port = process.env.PORT || 3000;
log.info('Starting server');
server.listen(port, function () {
  log.info('Application started and listening on port ' + port);
});

const session = Session({
  secret: secrets.SESSION_SECRET,
  resave: true,
  saveUninitialized: true
});

app.use(function requireHTTPS(req, res, next) {
  if (req.get('x-site-deployment-id') && !req.get('x-arr-ssl')) {
    return res.redirect('https://' + req.get('host') + req.url);
  }

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
