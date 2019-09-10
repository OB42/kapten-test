'use strict';

const { expect } = require('chai');
const sinon = require('sinon');
const { ObjectId } = require('mongodb');

const dateLib = require('../../src/lib/date');
const rides = require('../../src/models/rides');

const date = require('../fixtures/date');
const { ridesModel: rideFixtures } = require('../fixtures/rides');

describe('models/rides', () => {
  const sandbox = sinon.sandbox.create();

  beforeEach(async () => {
    await rides.collection().remove({});
    sandbox.stub(dateLib, 'getDate').returns(date);
  });

  afterEach(() => sandbox.restore());

  describe('#insertOne', () => {
    it('inserts a new ride record into the database', async () => {
      const ride = await rides.insertOne({
        _id: ObjectId.createFromHexString('000000000000000000000001'),
        rider_id: ObjectId.createFromHexString('111111111111111111111110'),
        amount: 10,
        created_at: date,
        state: 'created'
      });

      expect(ride).to.deep.equal({
        _id: ObjectId.createFromHexString('000000000000000000000001'),
        rider_id: ObjectId.createFromHexString('111111111111111111111110'),
        amount: 10,
        created_at: date,
        state: 'created'
      });

      const dbRides = await rides.collection().find().toArray();
      expect(dbRides).to.deep.equal([{
        _id: ObjectId.createFromHexString('000000000000000000000001'),
        rider_id: ObjectId.createFromHexString('111111111111111111111110'),
        amount: 10,
        created_at: date,
        state: 'created'
      }]);
    });
  });

  describe('#find', () => {
    beforeEach(async () => {
      await rides.collection().insertMany(rideFixtures);
    });

    it('finds all rides', async () => {
      const results = await rides.find().toArray();
      expect(results).to.deep.equal([
        {
          _id: ObjectId.createFromHexString('000000000000000000000001'),
          rider_id: ObjectId.createFromHexString('111111111111111111111110'),
          amount: 10,
          created_at: date,
          state: 'created'
        },
        {
          _id: ObjectId.createFromHexString('000000000000000000000002'),
          rider_id: ObjectId.createFromHexString('111111111111111111111110'),
          amount: 25,
          state: 'created',
          created_at: date
        },
        {
          _id: ObjectId.createFromHexString('000000000000000000000003'),
          rider_id: ObjectId.createFromHexString('111111111111111111111111'),
          amount: 50,
          state: 'created',
          created_at: date
        }
      ]);
    });

    it('finds all rides matching a query', async () => {
      const results = await rides.find({ amount: 50 }).toArray();
      expect(results).to.deep.equal([
        {
          _id: ObjectId.createFromHexString('000000000000000000000003'),
          rider_id: ObjectId.createFromHexString('111111111111111111111111'),
          amount: 50,
          state: 'created',
          created_at: date
        }
      ]);
    });

    it('applies the projection', async () => {
      const results = await rides.find({}, { amount: 1 }).toArray();
      expect(results).to.deep.equal([
        {
          _id: ObjectId.createFromHexString('000000000000000000000001'),
          amount: 10
        },
        {
          _id: ObjectId.createFromHexString('000000000000000000000002'),
          amount: 25
        },
        {
          _id: ObjectId.createFromHexString('000000000000000000000003'),
          amount: 50
        }
      ]);
    });
  });

  describe('#findOneById', () => {
    beforeEach(async () => {
      await rides.insertOne(
        {
          _id: '000000000000000000000001',
          rider_id: '111111111111111111111110',
          amount: 10,
          state: 'created'
        }
      );
    });

    it('finds a ride by id', async () => {
      const results = await rides.findOneById(
        ObjectId.createFromHexString('000000000000000000000001'));

      expect(results).to.deep.equal({
        _id: ObjectId.createFromHexString('000000000000000000000001'),
        rider_id: ObjectId.createFromHexString('111111111111111111111110'),
        amount: 10,
        created_at: date,
        state: 'created'
      });
    });

    it('applies the projections', async () => {
      const results = await rides.findOneById(
        ObjectId.createFromHexString('000000000000000000000001'),
        { rider_id: 1, amount: 1 });

      expect(results).to.deep.equal({
        _id: ObjectId.createFromHexString('000000000000000000000001'),
        rider_id: ObjectId.createFromHexString('111111111111111111111110'),
        amount: 10
      });
    });
  });
});
