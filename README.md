# TCQ

A TC39 Discussion Queue

TCQ handles your meeting agenda and speaker queue to ensure efficient time use and equal access from all participants.

## Prerequisites

You must have an Azure Subscription, and a Cosmos DB account to use this package.
You can get a trail version for this as described here: https://learn.microsoft.com/en-us/azure/cosmos-db/try-free?tabs=nosql \
and here is a direct link: https://cosmos.azure.com/try/

## Setup

https://learn.microsoft.com/en-us/azure/cosmos-db/nosql/quickstart-nodejs?tabs=azure-portal%2Cpasswordless%2Cwindows%2Csign-in-azure-cli

Get the URI and the KEY from the "Connect" tab of your Cosmos DB subscription and put that information in the `.env` file.

The database and container will be created by the application if they are not already present.

The usual steps for node projects apply:

```
$ npm i
$ npm run build
```

For a local development experience you start the server with:

```
$ npm run --w packages/server dev
```

To build and run a dockerized variant, do the above steps followed by:

```
$ docker compose up -d
```

These steps should give you a production like environment with your very own CosmosDB instance.
