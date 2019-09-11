'use strict';

const express = require('express');
const wrap = require('co-express');

const controller = require('./controller');

const router = express.Router();

router.get('/loyalty/:rider_id', wrap(controller.getLoyaltyInfo));

router.get('/average_spending/:rider_id/:status', wrap(controller.getAverageSpendingByStatus));

router.post('/remove_loyalty_points', wrap(controller.removeLoyaltyPoints));

module.exports = router;
