FROM node:20.9.0-bookworm-slim

ARG PORT

ENV PORT $PORT
ENV NODE_ENV=production
ENV NPM_CONFIG_PREFIX=/home/node/.npm-global
ENV PATH=$PATH:/home/node/.npm-global/bin

EXPOSE $PORT

WORKDIR /home/node/app/

COPY . ./

RUN npm ci --only=production && npm cache clean --force

USER node

CMD [ "node", "packages/server/dist/server.js" ]
