'use strict';

const HttpStatus = require('http-status-codes');

const Joi = require('../../lib/joi');
const ridersLib = require('../../lib/riders');

const { getLoyaltyInfoSchema, getAverageSpendingSchema } = require('./schemas');

const { RIDER_NOT_FOUND } = ridersLib;

/**
 * Get current rider status
 *
 * @param {Object} req express request
 * @param {Object} res express response
 *
 * @returns {Object} response
 */
async function getLoyaltyInfo(req, res) {
  const { error, value: validatedParams } = Joi
    .validate(req.params, getLoyaltyInfoSchema);

  if (error) {
    req.logger.info({ error }, '[loyalty#getLoyaltyInfo] Error: invalid body');
    return res.sendStatus(HttpStatus.BAD_REQUEST);
  }

  const { rider_id: riderId } = validatedParams;
  req.logger.info(
    { rider_id: riderId },
    '[loyalty#getLoyaltyInfo] Rider info requested');

  let rider;
  try {
    rider = await ridersLib.getLoyaltyInfo(riderId);
  } catch (err) {
    if (err.message === RIDER_NOT_FOUND.message) {
      req.logger.info(
        { rider_id: riderId },
        '[loyalty#getLoyaltyInfo] User does not exist');
      return res.sendStatus(HttpStatus.NOT_FOUND);
    }
    req.logger.info(
      { rider_id: riderId, err },
      '[loyalty#getLoyaltyInfo] Error while fetching user\'s loyalty info');
    return res.sendStatus(HttpStatus.INTERNAL_SERVER_ERROR);
  }

  return res.send(rider);
}

/**
 * Get the average amount spent on all rides for a given user and a given loyalty status
 *
 * @param {Object} req express request
 * @param {Object} res express response
 *
 * @returns {Object} response
 */
async function getAverageSpendingByStatus(req, res) {
  const { error, value: validatedParams } = Joi
    .validate(req.params, getAverageSpendingSchema);

  if (error) {
    req.logger.info({ error }, '[average_spending#getAverageSpendingByStatus] Error: invalid body');
    return res.sendStatus(HttpStatus.BAD_REQUEST);
  }

  const { rider_id: riderId, status } = validatedParams;
  req.logger.info(
    { rider_id: riderId, status },
    '[average_spending#getRidesByStatus]  requested');
  // TOOD:
  // get rides and calculate average spending
  // handle edge cases
  return res.send('');
}

module.exports = {
  getLoyaltyInfo,
  getAverageSpendingByStatus
};
