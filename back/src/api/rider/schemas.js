'use strict';

const Joi = require('../../lib/joi');
const { loyaltyStatuses } = require('../../constants/loyalty');

const getLoyaltyInfoSchema = Joi.object().keys({
  rider_id: Joi.objectId().required()
});

const getAverageSpendingSchema = Joi.object().keys({
  rider_id: Joi.objectId().required(),
  status: Joi.valid(loyaltyStatuses).default('bronze')
});

module.exports = { getLoyaltyInfoSchema, getAverageSpendingSchema };
