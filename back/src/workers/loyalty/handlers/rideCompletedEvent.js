'use strict';

const logger = require('chpr-logger');
const { ObjectId } = require('mongodb');
const riderModel = require('../../../models/riders');
const rideModel = require('../../../models/rides');
const loyalty = require('../../../lib/loyalty');
/**
 * Bus message handler for ride complete events
 *
 * @param   {Object} message The bus message object.
 * @param   {Object} messageFields The bus message metadata.
 * @returns {void}
 */
async function handleRideCompletedEvent(message) {
  const { id: rideId, amount, rider_id: riderId } = message;
  logger.info(
    { ride_id: rideId, rider_id: riderId, amount },
    '[worker.handleRideCompletedEvent] Received user ride completed event');
  let ride = await rideModel.findOneById(
    ObjectId.createFromHexString(rideId)
  );

  const rider = await riderModel.findOneById(
    ObjectId.createFromHexString(riderId)
  );

  if (!ride) {
    logger.info(
      { ride_id: rideId, rider_id: riderId },
      '[worker.handleRideCompletedEvent] Insert ride');
    ride = await rideModel.insertOne({
      _id: rideId,
      rider_id: riderId,
      amount,
      state: 'completed'
    });
  }
  await rideModel.updateOne(rideId, { state: 'completed' });
  await riderModel.updateOne(rider._id, {
    points: loyalty.getLoyaltyPointsForRideAmount(rider.status, amount),
    ride_count: rider.ride_count + 1
  });
  logger.info(
    { ride_id: rideId, rider_id: riderId, rider_update: loyalty.getRiderUpdate(rider, amount) },
      '[worker.handleRideCompletedEvent] Update rider');
}

module.exports = handleRideCompletedEvent;
