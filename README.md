# Building

`docker compose run --rm -i builder /bin/bash` and then run `npm i && npm run postinstall && npm run build-frontend && npm run build-backend`

# Local Development
* You need a GitHub OAuth app with `clientId` and `clientSecret`, these need to be set in `.env-development` that you can copy over from `.env-template` and set `TCQ_LOCAL_GH_SECRET`, `TCQ_LOCAL_GH_ID` and `TCQ_SESSION_SECRET`. Its `callbackUrl` _should_ be set to `http://localhost:3000/auth/github/callback`.

If you have a proper build, you can then run a dev container with `docker compose up dev`.
