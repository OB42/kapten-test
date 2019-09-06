const _ = require('lodash');
const amqplib = require('amqplib');
const logger = require('chpr-logger');
const crypto = require('crypto');

/**
 * Several events are produced:
 * - rider signup
 * - ride created
 * - ride completed
 *
 * Errors production:
 * - some events are sent twice
 * - some events are sent with wrong schema
 */

const AMQP_URL = process.env.AMQP_URL || 'amqp://guest:guest@localhost:5672';
const EXCHANGE = 'events';
const EVENTS = {
  rider_signed_up: {
    routing_key: 'rider.signup',
    probability: 0.2
  },
  ride_created: {
    routing_key: 'ride.created',
    probability: 0.2
  },
  ride_completed: {
    routing_key: 'ride.completed',
    probability: 0.2
  }
};
const ERRORS = {
  wrong_schema: {
    probability: 0.1
  },
  multiple_publication: {
    probability: 0.1
  }
};

/**
 * AMQP client for messages publication
 */
let client;

/**
 * Full list of riders
 */
const riders = new Map();

const sleep = n => new Promise(resolve => setTimeout(resolve, n));
const _randomObjectId = () => crypto.randomBytes(12).toString('hex');
const _randomAmount = () => 3 + (Math.floor(Math.random() * 30 * 100) / 100);

/**
 * initAmqp initializes the amqp connection
 *
 * @returns {void}
 */
async function initAmqp() {
  client = await amqplib.connect(AMQP_URL);
  client.channel = await client.createChannel();
  await client.channel.assertExchange(EXCHANGE, 'topic', {
    durable: true
  });
}

/**
 * _publish publishes the message's payload on the message's routing key.
 *
 * @param {Object} message         - defintion of the published content
 * @param {String} message.type    - defines which routing key to post the payload
 * @param {Object} message.payload - data to publish on the bus
 *
 * @returns {void}
 */
function _publish(message) {
  const routingKey = EVENTS[message.type].routing_key;
  logger.info({
    exchange: EXCHANGE,
    routing_key: routingKey,
    message
  }, 'Message publication');
  client.channel.publish(
    EXCHANGE,
    routingKey,
    new Buffer(JSON.stringify(message.payload)), {
      persistent: false,
      expiration: 10000 // ms
    }
  );
}

/**
 * publish manages whether message is published with errors (duplicate, invalid
 * payload for now)
 *
 * @param {Object} message         - defintion of the published content
 * @param {String} message.type    - defines which routing key to post the payload
 * @param {Object} message.payload - data to publish on the bus
 *
 * @returns {Boolean} Whether message was correctly published
 */
async function publish(message) {
  const errors = _.mapValues(ERRORS, error => Math.random() < error.probability);
  logger.info({ errors }, 'Message publication applied errors');

  if (errors.wrong_schema) {
    _publish({
      ...message,
      payload: { it_is: 'broken' }
    });
    return false;
  }

  if (errors.multiple_publication) {
    _publish(message);
    await sleep(100); // messages should not be published simultenaously
  }

  _publish(message);
  return true;
}

/**
 * riderSignup publishes a message to notify creation of a new user
 *
 * @returns {void}
 */
async function riderSignup() {
  const rider = {
    id: _randomObjectId(),
    name: 'John Doe'
  };

  // Message publication...
  const published = await publish({
    type: 'rider_signed_up',
    payload: rider
  });

  if (published) {
    riders.set(rider.id, rider);
  }
}

/**
 * riderRideCreate publishes a message to notify creation of a ride for the
 * rider
 *
 * @param {Object} rider - the rider whose ride is created for
 *
 * @returns {void}
 */
async function riderRideCreate(rider) {
  // a ride can't be created if rider is already in ride
  if (rider.ride) return;

  const ride = {
    id: _randomObjectId(),
    amount: _randomAmount(),
    rider_id: rider.id
  };

  // Message publication...
  const published = await publish({
    type: 'ride_created',
    payload: ride
  });

  if (published) {
    // Attach the ride info to the rider to be able to send them with ride
    // complete message
    riders.set(rider.id, {
      ...rider,
      ride: {
        id: ride.id,
        amount: ride.amount
      }
    });
  }
}

/**
 * riderRideCompleted publishes a message to notify that the ride of rider is
 * completed
 *
 * @param {Object} rider - the rider linked to the completed ride
 *
 * @returns {void}
 */
async function riderRideCompleted(rider) {
  const rideId = rider.ride ? rider.ride.id : _randomObjectId();
  const rideAmount = rider.ride ? rider.ride.amount : _randomAmount();
  const ride = {
    id: rideId,
    amount: rideAmount,
    rider_id: rider.id
  };

  // Message publication...
  const published = await publish({
    type: 'ride_completed',
    payload: ride
  });

  if (published) {
    // Remove ride from rider's data
    delete riders.get(rider.id).ride;
  }
}

 /**
  * riderTic randomly triggers ride events publication when called
  *
  * @param {Object} rider - the rider whose ride events will be linked to
  *
  * @returns {void}
  */
async function riderTic(rider) {
  if (Math.random() < EVENTS.ride_created.probability) {
    await riderRideCreate(rider);
  } else if (Math.random() < EVENTS.ride_completed.probability) {
    // else if because we don't want to publish create AND complete simultenaously
    await riderRideCompleted(rider);
  }
}

/**
 * tic calls the riderTic for each existing user, and randomly creates a new
 * user if max not reached yet.
 *
 * @param {Number} n - Maximum number of riders for the simulation
 *
 * @returns {void}
 */
async function tic(n) {
  const events = [];
  riders.forEach(rider => events.push(riderTic(rider)));
  await Promise.all(events);

  if (riders.size < n && Math.random() < EVENTS.rider_signed_up.probability) {
    await riderSignup();
  }
}

/**
 * main function for the simulation of events publication.
 * It initializes the bus then it indefinitely tics every "interval"
 * milliseconds
 *
 * @param {number} n        - Number of riders
 * @param {number} interval - Time interval (ms) between each tic (default 1000)
 *
 * @returns {void}
 */
async function main(n, interval = 1000) {
  logger.info({ n, interval }, '> Initialize RabbitMQ connection...');
  await initAmqp();
  logger.info('> RabbitMQ connection initialized');

  while (true) {
    await Promise.all([
      tic(n),
      new Promise(resolve => setTimeout(resolve, interval))
    ]);
  }
}

main(process.env.N, process.env.TIC)
  .then(() => {
    logger.info('> Worker stopped');
    process.exit(0);
  }).catch(err => {
    logger.error({
      err
    }, '! Worker stopped unexpectedly');
    process.exit(1);
  });
