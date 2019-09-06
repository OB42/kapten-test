'use strict';

const logger = require('chpr-logger');

const { handleMessageError } = require('../../../lib/workers');
const riderModel = require('../../../models/riders');

/**
 * Bus message handler for user signup events
 *
 * @param   {Object} message The bus message object.
 * @param   {Object} messageFields The bus message metadata.
 * @returns {void}
 */
async function handleSignupEvent(message, messageFields) {
  const { id: riderId, name } = message;

  logger.info(
    { rider_id: riderId, name },
    '[worker.handleSignupEvent] Received user signup event');

  // TODO make test pass if rider already created

  try {
    logger.info(
      { rider_id: riderId, name },
      '[worker.handleSignupEvent] Insert rider');
    await riderModel.insertOne({
      _id: riderId,
      name
    });
  } catch (err) {
    handleMessageError(err, message, messageFields);
  }
}

module.exports = handleSignupEvent;
