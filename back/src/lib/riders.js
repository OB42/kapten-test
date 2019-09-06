'use strict';

const riders = require('../models/riders');

const loyalty = require('./loyalty');

const RIDER_NOT_FOUND = new Error('Rider not found');

/**
 * getLoyaltyInfo tries to fetch rider with its id and return all his info
 * linked to the loyalty program
 *
 * @param {ObjectId} id - the user's mongo id
 *
 * @returns {Object} { rider_exists, { status, points, rides_to_next_status } }
 */
async function getLoyaltyInfo(id) {
  const rider = await riders.findOneById(id, {
    ride_count: 1,
    status: 1,
    points: 1
  });

  if (!rider) {
    throw RIDER_NOT_FOUND;
  }

  const { status, points, ride_count: rideCount } = rider;
  const ridesToNextStatus = loyalty.getRemainingRidesToNextStatus(rideCount);

  return {
    status,
    points,
    rides_to_next_status: ridesToNextStatus
  };
}

module.exports = {
  getLoyaltyInfo,
  RIDER_NOT_FOUND
};
