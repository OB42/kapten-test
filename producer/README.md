# Producer

Requirements:
- [Docker](https://docs.docker.com/engine/installation/)
- [nvm](https://github.com/creationix/nvm#installation) or node 7.8

## AMQP server

Follow these steps to start an AMQP container

```bash
# RabbitMQ
> docker pull rabbitmq:3-management
> docker create --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management
> docker start rabbitmq
```

> RabbitMQ is required to work on port `5672`

> RabbitMQ admin: [http://localhost:15672](http://localhost:15672) - login: `guest` - password: `guest`

## Producer

### Configuration

Producer behavior is defines by 2 environments variables:

- `N` - Total number of riders.
- `TIC` - Tic interval (ms) (default to 1000 ms)

### Docker

#### Start
Follow these steps to start your producer in a Docker container

```bash
> docker build ./ --tag 'producer:latest' .
> docker create --name producer --link rabbitmq producer:latest
> docker start producer
```

Logs can be accessed with `docker logs producer` command.
Once started, producer will start emitting the messages.

#### Config

Check the `Dockerfile` and update it if you want different tics interval
and/or max number of riders

#### Cleanup

```bash
> docker stop producer rabbitmq
> docker rm producer rabbitmq producer_rabbitmq_1
> docker rmi -f producer:latest rabbitmq:3-management
```

### Local

#### Start

If you're not at ease with Docker, you can start the producer locally following
these steps.

```bash
> nvm use
> npm install
> npm start
```

#### Config

Make sure to define at least N as it doesn't have a default.

- To define it once you can do it directly on command line `N=xxx npm run start`
- To define it for all your tests, `export N=xxx` before starting it
