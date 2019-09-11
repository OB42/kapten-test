'use strict';

const HttpStatus = require('http-status-codes');

const Joi = require('../../lib/joi');
const ridersLib = require('../../lib/riders');

const { getLoyaltyInfoSchema, getAverageSpendingSchema, removeLoyaltyPointsSchema } = require('./schemas');

const { RIDER_NOT_FOUND, NOT_ENOUGH_POINTS } = ridersLib;

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
    '[average_spending#getRidesByStatus] Average rider spending requested');

  let averageSpending;
  try {
    averageSpending = await ridersLib.getAverageSpendingByStatus(riderId, status);
  } catch (err) {
    if (err.message === RIDER_NOT_FOUND.message) {
      req.logger.info(
        { rider_id: riderId },
        '[average_spending#getRidesByStatus] User does not exist');
      return res.sendStatus(HttpStatus.NOT_FOUND);
    }
    req.logger.info(
      { rider_id: riderId, err },
      '[average_spending#getRidesByStatus] Error while fetching user\'s average spending');
    return res.sendStatus(HttpStatus.INTERNAL_SERVER_ERROR);
  }

  return res.send({ average_spending: averageSpending });
}

/**
 * Removes loyalty points from a user
 *
 * @param {Object} req express request
 * @param {Object} res express response
 *
 * @returns {Object} response
 */
async function removeLoyaltyPoints(req, res) {
  const { error, value: validatedParams } = Joi
    .validate(req.body, removeLoyaltyPointsSchema);

  if (error) {
    req.logger.info({ error }, '[remove_loyalty_points#removeLoyaltyPoints] Error: invalid body');
    return res.sendStatus(HttpStatus.BAD_REQUEST);
  }

  const { rider_id: riderId, points } = validatedParams;
  req.logger.info(
    { rider_id: riderId, points },
    '[remove_loyalty_points#removeLoyaltyPoints] Loyalty points removal requested');

  try {
    await ridersLib.removeLoyaltyPoints(riderId, points);
  } catch (err) {
    if (err.message === RIDER_NOT_FOUND.message) {
      req.logger.info(
        { rider_id: riderId },
        '[remove_loyalty_points#removeLoyaltyPoints] User does not exist');
      return res.sendStatus(HttpStatus.NOT_FOUND);
    }
    if (err.message === NOT_ENOUGH_POINTS.message) {
      req.logger.info(
        { rider_id: riderId },
        '[remove_loyalty_points#removeLoyaltyPoints] User does not have enough loyalty points');
      return res.sendStatus(HttpStatus.FORBIDDEN);
    }
    req.logger.info(
      { rider_id: riderId, err },
      '[remove_loyalty_points#removeLoyaltyPoints] Error while removing user\'s loyalty points');
    return res.sendStatus(HttpStatus.INTERNAL_SERVER_ERROR);
  }

  return res.send({});
}

module.exports = {
  getLoyaltyInfo,
  getAverageSpendingByStatus,
  removeLoyaltyPoints
};
