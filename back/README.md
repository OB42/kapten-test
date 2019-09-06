# Loyalty micro-service

## Installation
``` bash
> npm install
```

## Launch tests

To run tests, you'll need a rabbitmq server running locally (instructions to
start a rabbitmq docker container are given in the producer's `README`)

You'll also need a mongo database running on port `27017`. Best way is to run
one in a docker container. To do so, follow these steps:

```bash
> docker pull mongo:3.6
> docker create --name mongo -p 27017:27017 mongo:3.6
> docker start mongo
```

To start linter + all tests:

``` bash
> npm test
```

If you just want to start specific test, you can grep them this way:
```bash
npm run mocha -- --grep 'theStringToGrep'

# Example
npm run mocha -- --grep '#getRemainingRidesToNextStatus'
```

## Start server
``` bash
> npm start
```

## Start worker
``` bash
> npm run start:loyalty_worker
```
