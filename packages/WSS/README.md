# WSS Package

The WebSocket Server package provides functionality for WebSocket communication in your application.

The SocketIO client needs to send the `tcqUserId` in the auth option eg.: `const socket = io({ auth: { tcqUserId: 'abc' } })`.\
The client can alternatively send it as a header during the handshake.

The client MUST listen to the event topic `'state'` - else you will not get the login information.\
These include the authentication url and the pass code to enter, as well as the tcqUserId.
