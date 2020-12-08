# Producer

Requirements:
- [Docker](https://docs.docker.com/engine/installation/)
- [nvm](https://github.com/creationix/nvm#installation) or node 10.15

## Docker installation

```bash
# MongoDB
docker pull mongo
docker crate --name mongodb -p 27017:27017 mongo
docker start mongodb

# RabbitMQ
docker pull rabbitmq:3-management
docker create --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management
docker start rabbitmq

# Producer
docker build --tag 'producer:latest' .
docker create --name producer --link rabbitmq producer:latest
docker start producer
```

> MongoDB connexion : `mongodb://localhost:27017`
> RabbitMQ admin: [http://localhost:15672](http://localhost:15672) - login: `guest` - password: `guest`

## Local installation for the producer (not running in a Docker container)

```bash
(optional) nvm use
npm install
npm start
```

> MongoDB is required to work on port `27017`
> RabbitMQ is required to work on port `5672`

## Configuration

The following environments variables are available to configure the `producer` worker. You can edit the `Dockerfile` to change these.

- `N`[=10] - Total number of riders.
- `TIC`[=1000] - Tic interval (ms)

## Cleanup (docker)

```bash
docker stop producer rabbitmq mongodb
docker rm producer rabbitmq producer_rabbitmq_1 mongodb
docker rmi -f producer:latest rabbitmq:3-management mongo
```
