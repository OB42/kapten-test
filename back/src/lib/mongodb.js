'use strict';

const { MongoClient } = require('mongodb');
const logger = require('chpr-logger');
const config = require('../config');

let db;

/**
 * Connect the database
 *
 * @export
 */
async function connect() {
  db = await MongoClient.connect(config.mongodb.url, config.mongodb.options);
  logger.info({ db: config.mongodb.name }, '> Database connected');
}

/**
 * Disconnect the database
 *
 * @export
 */
async function disconnect() {
  await db.close();
  logger.info({ db: config.mongodb.name }, '> Mongodb disconnected');
}

/**
 *
 * @returns {*}
 */
function getDb() {
  return db;
}

module.exports = {
  connect,
  disconnect,
  getDb
};
