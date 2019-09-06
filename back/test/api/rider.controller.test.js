'use strict';

const { expect } = require('chai');
const request = require('supertest');
const sinon = require('sinon');
const { ObjectId } = require('mongodb');

const { start, stop } = require('../../src/app');
const ridersLib = require('../../src/lib/riders');
const riders = require('../../src/models/riders');

describe('api/rider', () => {
  const sandbox = sinon.sandbox.create();
  const riderId = '000000000000000000000001';

  let app;
  before(async () => {
    app = await start();
  });

  after(async () => {
    await stop();
  });

  beforeEach(async () => {
    await riders.collection().remove({});
  });

  afterEach(() => sandbox.restore());

  describe('GET /loyalty/:rider_id', () => {
    it('returns 400 if rider id is invalid', async () => {
      const { body, status } = await request(app)
        .get('/api/rider/loyalty/invalid_id');

      expect({ body, status }).to.deep.equal({ body: {}, status: 400 });
    });

    it('returns 404 if rider is not found', async () => {
      const { body, status } = await request(app)
        .get(`/api/rider/loyalty/${riderId}`);

      expect({ body, status }).to.deep.equal({ body: {}, status: 404 });
    });

    it('returns 500 if there is an unexpected error while fetching data', async () => {
      const unexpectedError = new Error('Unexpected error');
      const getLoyaltyInfoStub = sandbox.stub(ridersLib, 'getLoyaltyInfo')
        .rejects(unexpectedError);

      const { body, status } = await request(app)
        .get(`/api/rider/loyalty/${riderId}`);

      expect({ body, status }).to.deep.equal({ body: {}, status: 500 });

      expect(getLoyaltyInfoStub.args).to.deep.equal([
        [ObjectId.createFromHexString('000000000000000000000001')]
      ]);
    });

    it('returns rider status', async () => {
      await riders.insertOne({
        _id: riderId,
        ride_count: 30,
        points: 150,
        status: 'silver'
      });

      const { body, status } = await request(app)
        .get(`/api/rider/loyalty/${riderId}`);

      expect({ body, status }).to.deep.equal({
        status: 200,
        body: {
          points: 150,
          status: 'silver',
          rides_to_next_status: 20
        }
      });
    });
  });
});
