'use strict';

const { ObjectId } = require('mongodb');

const date = require('./date');

module.exports = Object.freeze({
  // ------------------------------------------
  // ------- Used to test the rides model -----
  // ------------------------------------------
  ridesModel: Object.freeze([
    Object.freeze({
      _id: ObjectId.createFromHexString('000000000000000000000001'),
      rider_id: ObjectId.createFromHexString('111111111111111111111110'),
      amount: 10,
      created_at: date
    }),
    Object.freeze({
      _id: ObjectId.createFromHexString('000000000000000000000002'),
      rider_id: ObjectId.createFromHexString('111111111111111111111110'),
      amount: 25,
      created_at: date
    }),
    Object.freeze({
      _id: ObjectId.createFromHexString('000000000000000000000003'),
      rider_id: ObjectId.createFromHexString('111111111111111111111111'),
      amount: 50,
      created_at: date
    })
  ])
});
