'use strict';

const {
  loyaltyStatuses,
  loyaltySteps
} = require('../constants/loyalty');

/**
 * Get loyalty status index in configuration arrays for given ride count
 *
 * @param {Number} rideCount - number of rides
 *
 * @returns {number} loyalty status index
 */
function _getStatusIndex(rideCount) {
  // eslint-disable-next-line arrow-body-style
  return loyaltySteps.reduce((result, current, index) => {
    return current > rideCount ? result : index;
  });
}

/**
 * Get loyalty status for a specific ride count
 *
 * @param {Number} rideCount - number of rides
 *
 * @returns {string} loyalty status
 */
function getLoyaltyStatusForRideCount(rideCount) {
  if (rideCount >= 100) {
    return 'platinum';
  } else if (rideCount >= 50) {
    return 'gold';
  } else if (rideCount >= 20) {
    return 'silver';
  }
  return 'bronze';
}

/**
 * Get loyalty points earned for a ride amount
 *
 * @param {String} loyaltyStatus - target status
 * @param {Number} rideAmount    - amount spent in the ride
 *
 * @returns {Number} amount of earned loyalty points
 */
function getLoyaltyPointsForRideAmount(loyaltyStatus, rideAmount) {
  const multipliers = { bronze: 1, silver: 3, gold: 5, platinum: 10 };
  return rideAmount * multipliers[loyaltyStatus];
}

/**
 * Get remaining ride count to get to the next loyalty status
 *
 * @param {Number} rideCount - current ride count
 *
 * @returns {number} remaining rides or zero if already at max status
 */
function getRemainingRidesToNextStatus(rideCount) {
  const loyaltyIndex = _getStatusIndex(rideCount);
  // User already has the best status
  if (loyaltyIndex + 1 === loyaltyStatuses.length) {
    return 0;
  }
  return loyaltySteps[loyaltyIndex + 1] - rideCount;
}

/**
 * Returns the rider with loyalty values updated according to the ride
 *
 * @param {Object} rider            - updated rider
 * @param {Number} rider.ride_count - current nb of rides for rider
 * @param {Number} rider.points     - current nb of points for rider
 * @param {String} rider.status     - current status of rider
 * @param {Number} amount           - amount of points rider gets with the ride
 *
 * @returns {Object} { ride_count, points, status } updated values after ride
 */
function getRiderUpdate({ ride_count: rideCount, points, status }, amount) {
  return {
    ride_count: rideCount + 1,
    points: points + getLoyaltyPointsForRideAmount(status, amount),
    status: getLoyaltyStatusForRideCount(rideCount + 1)
  };
}

module.exports = {
  getLoyaltyStatusForRideCount,
  getLoyaltyPointsForRideAmount,
  getRemainingRidesToNextStatus,
  getRiderUpdate
};
