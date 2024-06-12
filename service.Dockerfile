FROM ubuntu:20.04 AS builder

RUN apt-get update && DEBIAN_FRONTEND=noninteractive TZ=Etc/UTC apt-get -y install nodejs npm

WORKDIR /opt/build
COPY . ./

RUN npm i && npm run build-production

FROM node:10.19-slim

WORKDIR /home/node/app/

COPY --from=builder /opt/build/ /home/node/app/

ENV NODE_ENV production
ENV PORT 3000

EXPOSE $PORT

CMD ["node", "./dist/server/server.js"]
