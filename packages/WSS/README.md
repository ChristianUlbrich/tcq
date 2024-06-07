# WSS Package

The WebSocket Server package provides functionality for WebSocket communication in your application.

The SocketIO client needs to send the `tcqUserId` in the auth option eg.: `const socket = io({ auth: { tcqUserId: 'abc' } })`.\
The client can alternatively send it as a header during the handshake.

The client MUST listen to the event topic `'auth'` - else you will not get the login information.\
These include the authentication url and the pass code to enter, as well as the tcqUserId.

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
