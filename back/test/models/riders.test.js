'use strict';

const { expect } = require('chai');
const sinon = require('sinon');
const { ObjectId } = require('mongodb');

const dateLib = require('../../src/lib/date');
const riders = require('../../src/models/riders');

const date = require('../fixtures/date');

describe('models/riders', () => {
  const sandbox = sinon.sandbox.create();

  beforeEach(async () => {
    await riders.collection().remove({});
    sandbox.stub(dateLib, 'getDate').returns(date);
  });

  afterEach(() => sandbox.restore());

  describe('#insertOne', () => {
    it('inserts a new rider record into the database', async () => {
      const rider = await riders.insertOne({
        _id: '000000000000000000000001',
        ride_count: 0,
        points: 0,
        status: 'bronze'
      });

      expect(rider).to.deep.equal({
        _id: ObjectId.createFromHexString('000000000000000000000001'),
        ride_count: 0,
        points: 0,
        status: 'bronze',
        created_at: date
      });

      const dbRiders = await riders.collection().find().toArray();
      expect(dbRiders).to.deep.equal([{
        _id: ObjectId.createFromHexString('000000000000000000000001'),
        ride_count: 0,
        points: 0,
        status: 'bronze',
        created_at: date
      }]);
    });

    it('does not insert a document failing validation', async () => {
      let error;

      try {
        await riders.insertOne({
          _id: '000000000000000000000001',
          name: 'short'
        });
      } catch (err) {
        error = err;
      }

      expect(error).to.be.an('Error')
        .with.property('message')
        .that.matches(/"name" length must be at least 6 characters long/);
    });
  });

  describe('#updateOne', () => {
    it('updates nothing if rider does not exists', async () => {
      const rider = await riders.updateOne(
        ObjectId.createFromHexString('000000000000000000000001'),
        {
          ride_count: 0,
          points: 0,
          status: 'bronze'
        }
      );

      expect(rider.result.nModified).to.equal(0);
      const dbRiders = await riders.collection().find().toArray();
      expect(dbRiders).to.deep.equal([]);
    });

    it('updates the model accordingly', async () => {
      await riders.insertOne({
        _id: '000000000000000000000001',
        ride_count: 0,
        points: 0,
        status: 'bronze'
      });

      const riderUpdated = await riders.updateOne(
        ObjectId.createFromHexString('000000000000000000000001'),
        {
          ride_count: 15,
          points: 1500,
          status: 'platinum'
        }
      );

      expect(riderUpdated.result.nModified).to.equal(1);

      const dbRiders = await riders.collection().find().toArray();
      expect(dbRiders).to.deep.equal([{
        _id: ObjectId.createFromHexString('000000000000000000000001'),
        ride_count: 15,
        points: 1500,
        status: 'platinum',
        created_at: date
      }]);
    });
  });

  describe('#find', () => {
    beforeEach(async () => {
      await riders.collection().insertMany([
        {
          _id: ObjectId.createFromHexString('000000000000000000000001'),
          ride_count: 0,
          points: 0,
          status: 'bronze',
          created_at: date
        },
        {
          _id: ObjectId.createFromHexString('000000000000000000000002'),
          ride_count: 22,
          points: 254,
          status: 'silver',
          created_at: date
        },
        {
          _id: ObjectId.createFromHexString('000000000000000000000003'),
          ride_count: 78,
          points: 1442,
          status: 'gold',
          created_at: date
        }
      ]);
    });

    it('finds all riders', async () => {
      const results = await riders.find().toArray();
      expect(results).to.deep.equal([
        {
          _id: ObjectId.createFromHexString('000000000000000000000001'),
          ride_count: 0,
          points: 0,
          status: 'bronze',
          created_at: date
        },
        {
          _id: ObjectId.createFromHexString('000000000000000000000002'),
          ride_count: 22,
          points: 254,
          status: 'silver',
          created_at: date
        },
        {
          _id: ObjectId.createFromHexString('000000000000000000000003'),
          ride_count: 78,
          points: 1442,
          status: 'gold',
          created_at: date
        }
      ]);
    });

    it('finds all riders matching a query', async () => {
      const results = await riders.find({ status: 'bronze' }).toArray();
      expect(results).to.deep.equal([
        {
          _id: ObjectId.createFromHexString('000000000000000000000001'),
          ride_count: 0,
          points: 0,
          status: 'bronze',
          created_at: date
        }
      ]);
    });

    it('applies the projection', async () => {
      const results = await riders.find({}, { status: 1 }).toArray();
      expect(results).to.deep.equal([
        {
          _id: ObjectId.createFromHexString('000000000000000000000001'),
          status: 'bronze'
        },
        {
          _id: ObjectId.createFromHexString('000000000000000000000002'),
          status: 'silver'
        },
        {
          _id: ObjectId.createFromHexString('000000000000000000000003'),
          status: 'gold'
        }
      ]);
    });
  });

  describe('#findOneById', () => {
    beforeEach(async () => {
      await riders.insertOne({
        _id: '000000000000000000000001',
        ride_count: 0,
        points: 0,
        status: 'bronze',
        created_at: date
      });
    });

    it('finds a rider by id', async () => {
      const results = await riders.findOneById(
        ObjectId.createFromHexString('000000000000000000000001'));

      expect(results).to.deep.equal({
        _id: ObjectId.createFromHexString('000000000000000000000001'),
        ride_count: 0,
        points: 0,
        status: 'bronze',
        created_at: date
      });
    });

    it('applies the projections', async () => {
      const results = await riders.findOneById(
        ObjectId.createFromHexString('000000000000000000000001'),
        { ride_count: 1, points: 1 });

      expect(results).to.deep.equal({
        _id: ObjectId.createFromHexString('000000000000000000000001'),
        ride_count: 0,
        points: 0
      });
    });
  });
});
