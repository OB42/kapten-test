'use strict';

const amqplib = require('amqplib');
const logger = require('chpr-logger');

const URL = 'amqp://guest:guest@localhost:5672';
const EXCHANGE = 'events';

let client;

async function init() {
  client = await amqplib.connect();
  logger.info('[test/utils] AMQP connected');
  client.channel = await client.createChannel(URL);
  await client.channel.assertExchange('events', 'topic', {
    durable: true
  });
}

async function close() {
  await client.close();
  logger.info('[test/utils] AMQP connection closed');
}

async function publish(routingKey, payload) {
  const message = new Buffer(JSON.stringify(payload));
  client.channel.publish(EXCHANGE, routingKey, message);
  // wait for the message to be handled
  await new Promise(resolve => setTimeout(resolve, 50));
}

module.exports = {
  init,
  close,
  publish
};
