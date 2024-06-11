import express, { Router } from 'express';
import passport from './passport.js';
import Meeting from '../../shared/dist/Meeting.js';
import { createMeeting, getMeeting } from './db.js';
import * as b64 from 'base64-url';
import type User from '../../shared/dist/User.js';
import { fromGHAU, getByUsernames, isChair as isChairForMeeting } from './User.js';
import log from './logger.js';

import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isChair } from './chairs.js';
const __dirname = dirname(fileURLToPath(import.meta.url));

const router = Router();

router.post('/meetings', async (req, res) => {
  res.contentType('json');

  let chairs: string = req.body.chairs;
  if (typeof chairs !== 'string') {
    res.status(400);
    res.send({ message: 'Must specify chairs' });
    res.end;
    return;
  }

  // split by commas, trim, and replace leading @ from usernames
  chairs = chairs.trim();
  let usernames: string[] = [];
  if (chairs.length > 0) {
    usernames = chairs.split(',').map(s => s.trim().replace(/^@/, ''));
  }

  let chairUsers: User[] = [];
  try {
    chairUsers = await getByUsernames(usernames, req.user.accessToken);
  } catch (e) {
    res.status(400);
    res.send({ message: e.message });
    res.end();
    return;
  }

  let id = b64.encode(
    [
      Math.floor(Math.random() * 2 ** 32),
      Math.floor(Math.random() * 2 ** 32),
      Math.floor(Math.random() * 2 ** 32)
    ],
    'binary'
  );

  let meeting: Meeting = {
    chairs: chairUsers,
    currentAgendaItem: undefined,
    currentSpeaker: undefined,
    currentTopic: undefined,
    timeboxEnd: undefined,
    timeboxSecondsLeft: undefined,
    agenda: [],
    queuedSpeakers: [],
    reactions: [],
    trackTemperature: false,
    id,
    partitionKey: process.env.DB_PARTITION_VALUE ?? 'tc39'
  };

  await createMeeting(meeting);
  res.send(meeting);
  res.end();
});

router.get('/login', passport.authenticate('github'));
router.get(
  '/api/auth/callback/github',
  passport.authenticate('github', { failureRedirect: '/login' }),
  function (req, res) {
    // Successful authentication, redirect home.
    if (req.session!.meetingId) {
      res.redirect('/meeting/' + req.session!.meetingId);
      delete req.session!.meetingId;
    } else {
      res.redirect('/new');
    }
  }
);

router.get('/logout', function (req, res) {
  req.logout({ keepSessionInfo: false }, (err) => {
    if (err) {
      log.warn('Something went wrong during logout.');
    }
    if (req.session) {
      req.session.destroy(() => {
        // TODO: Handle errors here?
        res.redirect('/');
      });
    } else {
      // not sure this branch happens
      res.redirect('/');
    }
  });
});


router.all('/', (req, res) => {
  if (req.isAuthenticated())
    res.sendFile(resolve(__dirname, '../../client/dist/new.html'));
  else
    res.sendFile(resolve(__dirname, '../../client/dist/home.html'));
});

router.get('/api/user', async (req, res) => {
  if (req.isAuthenticated()) {
    let user = fromGHAU(req.user);
    if (typeof req.query.meetingId === 'string') {
      user.isChair = isChairForMeeting(user, await getMeeting(req.query.meetingId) as Meeting);
    } else {
      user.isChair = isChair(user.ghid);
    }
    res.json(user);
  } else {
    res.sendStatus(401);
  }
});

router.all(/\/new(\.html)?$/, (req, res, next) => {
  if (req.isAuthenticated()) next();
  else res.redirect('/');
}, (req, res) => {
  res.sendFile(resolve(__dirname, '../../client/dist/new.html'));
});

router.all('/meeting/:id', (req, res, next) => {
  if (req.isAuthenticated()) {
    next();
  } else {
    req.session.meetingId = req.params.id;
    res.redirect('/login');
  }
}, async (req, res, next) => {
  try {
    await getMeeting(req.params.id);
    next();
  } catch (error) {
    res.sendStatus(404);
  }
}, (req, res) => {
  res.sendFile(resolve(__dirname, '../../client/dist/meeting.html'));
});
router.all('/*', express.static(resolve(__dirname, '../../client/dist/')));

export default router;
