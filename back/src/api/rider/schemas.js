'use strict';

const Joi = require('../../lib/joi');
const { loyaltyStatuses } = require('../../constants/loyalty');

const getLoyaltyInfoSchema = Joi.object().keys({
  rider_id: Joi.objectId().required()
});

const getAverageSpendingSchema = Joi.object().keys({
  rider_id: Joi.objectId().required(),
  status: Joi.valid(loyaltyStatuses).required()
});

const removeLoyaltyPointsSchema = Joi.object().keys({
  rider_id: Joi.objectId().required(),
  points: Joi.number().min(0).required()
});
module.exports = { getLoyaltyInfoSchema, getAverageSpendingSchema, removeLoyaltyPointsSchema };
