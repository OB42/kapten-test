'use strict';

const { expect } = require('chai');
const { ObjectId } = require('mongodb');

const ridersLib = require('../../src/lib/riders');
const riders = require('../../src/models/riders');

describe('lib/riders', () => {
  const riderId = '000000000000000000000001';
  const riderObjectId = ObjectId.createFromHexString('000000000000000000000001');

  beforeEach(async () => {
    await riders.collection().remove({});
  });

  describe('#getLoyaltyInfo', () => {
    it('throws if rider does not exist', async () => {
      let error;
      try {
        await ridersLib.getLoyaltyInfo(riderObjectId);
      } catch (err) {
        error = err;
      }
      expect(error.message).to.equal(ridersLib.RIDER_NOT_FOUND.message);
    });

    it('returns rider loyalty info enriched with number of rides to reach next status', async () => {
      await riders.insertOne({
        _id: riderId,
        ride_count: 24,
        status: 'silver',
        points: 563
      });

      const result = await ridersLib.getLoyaltyInfo(riderObjectId);
      expect(result).to.deep.equal({
        status: 'silver',
        points: 563,
        rides_to_next_status: 26
      });
    });
  });
});
