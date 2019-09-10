'use strict';

const { expect } = require('chai');
const request = require('supertest');
const sinon = require('sinon');
const logger = require('chpr-logger');
const { ObjectId } = require('mongodb');

const { start, stop } = require('../../src/app');
const ridersLib = require('../../src/lib/riders');
const riders = require('../../src/models/riders');
const rides = require('../../src/models/rides');

const date = require('../fixtures/date');

describe('api/rider', () => {
  const sandbox = sinon.sandbox.create();
  const riderId = '000000000000000000000001';
  const riderObjectId = ObjectId.createFromHexString(riderId);
  const rideId = '111111111111111111111110';
  const rideObjectId = ObjectId.createFromHexString(rideId);

  let app;
  before(async () => {
    app = await start();
  });

  after(async () => {
    await stop();
  });

  let infoSpy;
  beforeEach(async () => {
    await riders.collection().remove({});
    await rides.collection().remove({});
    infoSpy = sandbox.spy(logger, 'info');
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
  describe('GET /average_spending/:rider_id/:status', () => {

    it('returns 400 if rider id is invalid', async () => {
      const { body, status } = await request(app)
        .get('/api/rider/average_spending/invalid_id/bronze');

      expect({ body, status }).to.deep.equal({ body: {}, status: 400 });
    });

    it('returns 404 if rider is not found', async () => {
      const { body, status } = await request(app)
        .get(`/api/rider/average_spending/${riderId}/bronze`);

      expect({ body, status }).to.deep.equal({ body: {}, status: 404 });
    });

    it('returns 500 if there is an unexpected error while fetching data', async () => {
      await riders.insertOne({
        _id: riderId,
        ride_count: 30,
        points: 150,
        status: 'silver'
      });
      const unexpectedError = new Error('Unexpected error');
      const getLoyaltyInfoStub = sandbox.stub(ridersLib, 'getAverageSpendingByStatus')
        .rejects(unexpectedError);

      const { body, status } = await request(app)
        .get(`/api/rider/average_spending/${riderId}/bronze`);

      expect({ body, status }).to.deep.equal({ body: {}, status: 500 });

      // expect(getLoyaltyInfoStub.args).to.deep.equal([
        // [ObjectId.createFromHexString('000000000000000000000001')]
      // ]);
    });

    it('returns rider average spending', async () => {
      await riders.insertOne({
        _id: riderId,
        ride_count: 30,
        points: 150,
        status: 'silver'
      });
      await rides.insertOne({
        _id: rideObjectId,
        rider_id: riderObjectId,
        amount: 20,
        created_at: date,
        rider_status: 'silver',
        state: 'created'
      });
      await rides.insertOne({
        _id: new ObjectId(),
        rider_id: riderObjectId,
        amount: 30,
        created_at: date,
        rider_status: 'silver',
        state: 'created'
      });
      const { body, status } = await request(app)
        .get(`/api/rider/average_spending/${riderId}/silver`);
      console.log(body, status, infoSpy.args)
      expect({ body, status }).to.deep.equal({ body: {average_spending: 25}, status: 200 });
    });
  });
});
