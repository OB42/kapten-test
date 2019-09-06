'use strict';

const HttpStatus = require('http-status-codes');

const Joi = require('../../lib/joi');
const ridersLib = require('../../lib/riders');

const { getLoyaltyInfoSchema } = require('./schemas');

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

module.exports = {
  getLoyaltyInfo
};
