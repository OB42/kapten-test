'use strict';

const riders = require('../models/riders');

const rides = require('../models/rides');

const loyalty = require('./loyalty');

const RIDER_NOT_FOUND = new Error('Rider not found');

const NOT_ENOUGH_POINTS = new Error('Rider does not have enough loyalty points');

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

/**
 * getAverageSpendingByStatus tries to calculate the average amount spent
 * on rides matching a given rider_id and status
 *
 * @param {ObjectId} id - the user's mongo id
 * @param {String} status - the status
 *
 * @returns {Number} the average amount spent
 */
async function getAverageSpendingByStatus(id, status) {
  const rider = await riders.findOneById(id);

  if (!rider) {
    throw RIDER_NOT_FOUND;
  }
  const arr = await rides.find({ rider_status: status, rider_id: id },
    { amount: 1, _id: 0 }).toArray();
    // if no rides are found, returns 0 instead of calculating average amount
  return arr.length ? (arr.map(x => x.amount).reduce((a, b) => a + b) / arr.length) : 0;
}

/**
 * removeLoyaltyPoints tries to remove loyalty points from a user
 *
 * @param {ObjectId} id - the user's mongo id
 * @param {String} points - the number of points to remov
 *
 * @returns {void}
 */
async function removeLoyaltyPoints(id, points) {
  const rider = await riders.findOneById(id);

  if (!rider) {
    throw RIDER_NOT_FOUND;
  }
  if (rider.points < points) {
    throw NOT_ENOUGH_POINTS;
  }
  riders.updateOne(rider._id, { points: rider.points - points });
}

module.exports = {
  getLoyaltyInfo,
  RIDER_NOT_FOUND,
  NOT_ENOUGH_POINTS,
  getAverageSpendingByStatus,
  removeLoyaltyPoints
};
