'use strict';

const logger = require('chpr-logger');
const { ObjectId } = require('mongodb');

const rideModel = require('../../../models/rides');
const riderModel = require('../../../models/riders');

/**
 * Bus message handler for ride create events
 *
 * @param   {Object} message The bus message object.
 * @returns {void}
 */
async function handleRideCreatedEvent(message) {
  const { id: rideId, rider_id: riderId, amount } = message;
  logger.info(
    { ride_id: rideId, rider_id: riderId, amount },
    '[worker.handleRideCreatedEvent] Received user ride created event');

  let rider = await riderModel.findOneById(
    ObjectId.createFromHexString(riderId)
  );
  if (!rider) {
    rider = {
      _id: riderId
    };
    logger.info(
      { rider_id: riderId },
      '[worker.handleRideCreatedEvent] Rider does not exists: insert him');
    rider = await riderModel.insertOne(rider);
  }

  // Idempotency (if message was sent more than once)
  const ride = await rideModel.findOneById(
    ObjectId.createFromHexString(rideId)
  );
  if (ride) {
    logger.info('[worker.handleRideCreatedEvent] Ride already created');
    return;
  }

  logger.info(
    { ride_id: rideId, rider_id: riderId },
    '[worker.handleRideCreatedEvent] Insert ride');
  await rideModel.insertOne({
    _id: rideId,
    rider_id: riderId,
    amount,
    rider_status: rider.status
  });
}

module.exports = handleRideCreatedEvent;
