'use strict';

const co = require('co');

const logger = require('chpr-logger');
const workerLib = require('chpr-worker');

const config = require('../../config');
const Joi = require('../../lib/joi');
const mongo = require('../../lib/mongodb');

const {
  handleSignupEvent,
  handleRideCreatedEvent,
  handleRideCompletedEvent
} = require('./handlers');
const {
  rideCreatedSchema,
  rideCompletedSchema,
  signupSchema
} = require('./schemas');

/**
 * Initialize the mongo and bus connections.
 *
 * @returns {void}
 */
async function start() {
  await mongo.connect();

  try {
    const worker = workerLib.createWorkers(
      [
        {
          handle: handleSignupEvent,
          validate: message => Joi.assert(message, signupSchema),
          routingKey: 'rider.signup'
        },
        {
          handle: handleRideCreatedEvent,
          validate: message => Joi.assert(message, rideCreatedSchema),
          routingKey: 'ride.created'
        },
        {
          handle: handleRideCompletedEvent,
          validate: message => Joi.assert(message, rideCompletedSchema),
          routingKey: 'ride.completed'
        }
      ],
      {
        workerName: 'loyaltyWorker',
        amqpUrl: config.amqp.url,
        exchangeName: config.amqp.exchange,
        queueName: 'loyaltyQueue'
      },
      {
        channelPrefetch: 100,
        taskTimeout: 30000,
        processExitTimeout: 3000
      }
    );

    await worker.listen();
  } catch (err) {
    logger.error({ err },
      '[worker.loyalty.listen] An error occured');
  }
}

if (!module.parent) {
  co(start);
}

module.exports = start;
