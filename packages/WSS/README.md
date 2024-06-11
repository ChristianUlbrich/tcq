# WSS Package

The WebSocket Server package provides functionality for WebSocket communication in your application.

The SocketIO client needs to send the `tcqUserId` in the auth option eg.: `const socket = io({ auth: { tcqUserId: 'abc' } })`.\
The client can alternatively send it as a header during the handshake.

The client MUST listen to the event topic `'auth'` - else you will not get the login information.\
These include the authentication url and the pass code to enter, as well as the tcqUserId.

# API Description

These are the relevant SocketIO event names:

| Client send events | Server send answer |
| - | - |
| connection | `auth` or `state` |
| `newMeetingRequest` | `respond` and `newMeeting` |
| `newAgendaItemRequest` | `respond` and/or `newAgendaItem` |
| `deleteAgendaItemRequest` | `respond` and/or `deleteAgendaItem` |
| `nextAgendaItemRequest` | `respond` and/or `nextAgendaItem` and `newCurrentSpeaker` |
| `reorderAgendaItemRequest` | `respond` and/or `reorderAgendaItem` |
| `newQueuedSpeakerRequest` | `respond` and/or `newQueuedSpeaker` |
| `deleteQueuedSpeakerRequest` | `respond` and/or `deleteQueuedSpeaker` |
| `nextSpeaker` | `respond` and/or `nextSpeaker`, `newCurrentTopic` |
| `reorderQueueRequest` | `respond` and/or `updateQueuedSpeaker` or `reorderQueue` |
| `newReactionRequest` | `respond` and/or `newReaction` or `deleteReaction` |
| `trackTemperatureRequest` | `respond` or `trackTemperature` |

The types ans shape of the server and client side listeners can be found in the `@tc39/tcq-shared` package under `Messages`.

# Docker Container

Build and start the container with:

```console
> docker build --pull -t tcq-wss .
> docker run -d -p 3001:3001 \
  -e OAUTH_SCOPES="read:user" \
  -e OAUTH_CLIENT_ID="5***0" \
  -e OAUTH_CLIENT_SECRET="4***1" \
  -e CHAIRS="1337,42,1234" \
  tcq-wss
```
