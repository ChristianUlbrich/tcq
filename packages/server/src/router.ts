import { Router } from 'express';
import passport from './passport.js';
import Meeting from '../../shared/dist/Meeting.js';
import { createMeeting, getMeeting } from './db.js';
import * as b64 from 'base64-url';
import User, { getByUsernames } from './User.js';
import log from './logger.js';

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
    id
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
      res.redirect('/#/meeting/' + req.session!.meetingId);
      delete req.session!.meetingId;
    } else {
      res.redirect('/#/new');
    }
  }
);

router.get('/logout', function (req, res) {
  req.logout({ keepSessionInfo: false }, (err) => {
    log.warn('Something went wrong during logout.');
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

export default router;
