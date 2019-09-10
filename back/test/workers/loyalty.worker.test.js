const { expect } = require('chai');
const sinon = require('sinon');
const { ObjectId } = require('mongodb');
const logger = require('chpr-logger');
const _ = require('lodash');

const rideModel = require('../../src/models/rides');
const riderModel = require('../../src/models/riders');
const dateLib = require('../../src/lib/date');
const startWorker = require('../../src/workers/loyalty');

const date = require('../fixtures/date');
const {
  init: initPublisher,
  close: closePublisher,
  publish
} = require('../utils/amqp');

describe('workers/loyalty', () => {
  const sandbox = sinon.sandbox.create();

  before(async () => {
    await startWorker();
    await initPublisher();
  });

  after(async () => {
    await closePublisher();
  });

  let infoSpy;
  beforeEach(async () => {
    await rideModel.collection().remove({});
    await riderModel.collection().remove({});
    sandbox.stub(dateLib, 'getDate').returns(date);
    infoSpy = sandbox.spy(logger, 'info');
  });

  afterEach(() => sandbox.restore());

  describe('#handleSignupEvent', () => {
    const message = {
      id: '000000000000000000000001',
      name: 'John Doe'
    };

    it('saves rider in db when message is valid', async () => {
      await publish('rider.signup', message);

      const riders = await riderModel.find().toArray();
      expect(riders).to.deep.equal([{
        _id: ObjectId.createFromHexString('000000000000000000000001'),
        name: 'John Doe',
        ride_count: 0,
        points: 0,
        status: 'bronze',
        created_at: date
      }]);

      expect(infoSpy.args).to.deep.equal([
        [
          {
            rider_id: '000000000000000000000001',
            name: 'John Doe'
          },
          '[worker.handleSignupEvent] Received user signup event'
        ],
        [
          {
            rider_id: '000000000000000000000001',
            name: 'John Doe'
          },
          '[worker.handleSignupEvent] Insert rider'
        ]
      ]);
    });

    it('does not try to save user if he is already saved in db', async () => {
      await riderModel.insertOne({
        _id: '000000000000000000000001',
        name: 'John Doe'
      });

      await publish('rider.signup', message);

      const riders = await riderModel.find().toArray();
      expect(riders).to.deep.equal([{
        _id: ObjectId.createFromHexString('000000000000000000000001'),
        name: 'John Doe',
        ride_count: 0,
        points: 0,
        status: 'bronze',
        created_at: date
      }]);

      expect(infoSpy.args).to.deep.equal([
        [
          {
            rider_id: '000000000000000000000001',
            name: 'John Doe'
          },
          '[worker.handleSignupEvent] Received user signup event'
        ],
        [
          '[worker.handleSignupEvent] Rider already treated'
        ]
      ]);
    });

    it('tries a second time then drops message if error during rider insertion', async () => {
      const error = new Error('insertion error');
      sandbox.stub(riderModel, 'insertOne').rejects(error);
      const errorSpy = sandbox.spy(logger, 'error');

      await publish('rider.signup', message);

      expect(infoSpy.args).to.deep.equal([
        [
          {
            name: 'John Doe',
            rider_id: '000000000000000000000001'
          },
          '[worker.handleSignupEvent] Received user signup event'
        ],
        [
          {
            name: 'John Doe',
            rider_id: '000000000000000000000001'
          },
          '[worker.handleSignupEvent] Insert rider'
        ],
        [
          {
            name: 'John Doe',
            rider_id: '000000000000000000000001'
          },
          '[worker.handleSignupEvent] Received user signup event'
        ],
        [
          {
            name: 'John Doe',
            rider_id: '000000000000000000000001'
          },
          '[worker.handleSignupEvent] Insert rider'
        ]
      ]);

      const riders = await riderModel.find().toArray();
      expect(riders).to.deep.equal([]);

      expect(errorSpy.callCount).to.equal(1);
      expect(errorSpy.args[0][1]).to.equal(
        '[worker.handleMessageError] Could not handle message for the second time, dropping it');
    });

    it('fails validation if no id in message', async () => {
      await publish('rider.signup', _.omit(message, 'id'));

      const riders = await riderModel.find().toArray();
      expect(riders).to.deep.equal([]);

      expect(infoSpy.args).to.deep.equal([]);
    });

    it('fails validation if id is not a valid ObjectId', async () => {
      await publish('rider.signup', { ...message, id: 'not valid' });

      const riders = await riderModel.find().toArray();
      expect(riders).to.deep.equal([]);

      expect(infoSpy.args).to.deep.equal([]);
    });

    it('fails validation if no name in message', async () => {
      await publish('rider.signup', _.omit(message, 'name'));

      const riders = await riderModel.find().toArray();
      expect(riders).to.deep.equal([]);

      expect(infoSpy.args).to.deep.equal([]);
    });

    it('fails validation if name contains less than 6 letters', async () => {
      await publish('rider.signup', { ...message, name: 'short' });

      const riders = await riderModel.find().toArray();
      expect(riders).to.deep.equal([]);

      expect(infoSpy.args).to.deep.equal([]);
    });
  });

  describe('#handleRideCreatedEvent', () => {
    const message = {
      id: '111111111111111111111110',
      amount: 10,
      rider_id: '000000000000000000000001'
    };

    it('saves ride in db when message is valid and riders exists', async () => {
      await riderModel.insertOne({
        _id: '000000000000000000000001',
        name: 'John Doe'
      });

      await publish('ride.created', message);

      const rides = await rideModel.find().toArray();
      expect(rides).to.deep.equal([{
        _id: ObjectId.createFromHexString('111111111111111111111110'),
        rider_id: ObjectId.createFromHexString('000000000000000000000001'),
        amount: 10,
        created_at: date,
        rider_status: 'bronze',
        state: 'created'
      }]);
      console.log('42');

      expect(infoSpy.args).to.deep.equal([
        [
          {
            ride_id: '111111111111111111111110',
            rider_id: '000000000000000000000001',
            amount: 10
          },
          '[worker.handleRideCreatedEvent] Received user ride created event'
        ],
        [
          {
            ride_id: '111111111111111111111110',
            rider_id: '000000000000000000000001'
          },
          '[worker.handleRideCreatedEvent] Insert ride'
        ]
      ]);
    });

    it('does not try to save ride if it is already saved in db', async () => {
      await riderModel.insertOne({
        _id: '000000000000000000000001',
        name: 'John Doe'
      });
      await rideModel.insertOne({
        _id: '111111111111111111111110',
        rider_id: '000000000000000000000001',
        amount: 10
      });

      await publish('ride.created', message);

      const rides = await rideModel.find().toArray();
      expect(rides).to.deep.equal([{
        _id: ObjectId.createFromHexString('111111111111111111111110'),
        rider_id: ObjectId.createFromHexString('000000000000000000000001'),
        amount: 10,
        created_at: date,
        state: 'created'
      }]);

      expect(infoSpy.args).to.deep.equal([
        [
          {
            ride_id: '111111111111111111111110',
            rider_id: '000000000000000000000001',
            amount: 10
          },
          '[worker.handleRideCreatedEvent] Received user ride created event'
        ],
        [
          '[worker.handleRideCreatedEvent] Ride already created'
        ]
      ]);
    });

    it('also inserts rider in db if he does not exist', async () => {
      await publish('ride.created', message);

      const rides = await rideModel.find().toArray();
      expect(rides).to.deep.equal([{
        _id: ObjectId.createFromHexString('111111111111111111111110'),
        rider_id: ObjectId.createFromHexString('000000000000000000000001'),
        state: 'created',
        amount: 10,
        rider_status: 'bronze',
        state: 'created',
        created_at: date
      }]);

      const riders = await riderModel.find().toArray();
      expect(riders).to.deep.equal([{
        _id: ObjectId.createFromHexString('000000000000000000000001'),
        ride_count: 0,
        points: 0,
        status: 'bronze',
        created_at: date
      }]);

      expect(infoSpy.args).to.deep.equal([
        [
          {
            ride_id: '111111111111111111111110',
            rider_id: '000000000000000000000001',
            amount: 10
          },
          '[worker.handleRideCreatedEvent] Received user ride created event'
        ],
        [
          {
            rider_id: '000000000000000000000001'
          },
          '[worker.handleRideCreatedEvent] Rider does not exists: insert him'
        ],
        [
          {
            ride_id: '111111111111111111111110',
            rider_id: '000000000000000000000001'
          },
          '[worker.handleRideCreatedEvent] Insert ride'
        ]
      ]);
    });

    it('fails validation if no id in message', async () => {
      await publish('ride.created', _.omit(message, 'id'));

      const rides = await rideModel.find().toArray();
      expect(rides).to.deep.equal([]);

      expect(infoSpy.args).to.deep.equal([]);
    });

    it('fails validation if id is not a valid ObjectId', async () => {
      await publish('ride.created', { ...message, id: 'not valid' });

      const rides = await rideModel.find().toArray();
      expect(rides).to.deep.equal([]);

      expect(infoSpy.args).to.deep.equal([]);
    });

    it('fails validation if no rider_id in message', async () => {
      await publish('ride.created', _.omit(message, 'rider_id'));

      const rides = await rideModel.find().toArray();
      expect(rides).to.deep.equal([]);

      expect(infoSpy.args).to.deep.equal([]);
    });

    it('fails validation if rider_id is not a valid ObjectId', async () => {
      await publish('ride.created', { ...message, rider_id: 'not valid' });

      const rides = await rideModel.find().toArray();
      expect(rides).to.deep.equal([]);

      expect(infoSpy.args).to.deep.equal([]);
    });

    it('fails validation if no amount in message', async () => {
      await publish('ride.created', _.omit(message, 'amount'));

      const rides = await rideModel.find().toArray();
      expect(rides).to.deep.equal([]);

      expect(infoSpy.args).to.deep.equal([]);
    });

    it('fails validation if amount is not a number', async () => {
      await publish('ride.created', { ...message, amount: 'not valid' });

      const rides = await rideModel.find().toArray();
      expect(rides).to.deep.equal([]);

      expect(infoSpy.args).to.deep.equal([]);
    });

    it('fails validation if amount is negative', async () => {
      await publish('ride.created', { ...message, amount: -5 });

      const rides = await rideModel.find().toArray();
      expect(rides).to.deep.equal([]);

      expect(infoSpy.args).to.deep.equal([]);
    });
  });

  describe('#handleRideCompletedEvent', () => {
    const riderId = '000000000000000000000001';
    const riderObjectId = ObjectId.createFromHexString(riderId);
    const rideId = '111111111111111111111110';
    const rideObjectId = ObjectId.createFromHexString(rideId);
    const riderBefore = {
      _id: riderId,
      name: 'John Doe',
      points: 1600,
      status: 'silver',
      ride_count: 49
    };

    const message = {
      id: rideId,
      amount: 10,
      rider_id: riderId
    };

    it('does not try to update the db if the message was already received', async () => {
      await publish('ride.completed', message);

      const ride = await rideModel.findOneById(rideObjectId);
      const rider = await riderModel.findOneById(ride.rider_id);
      await publish('ride.completed', message);
      expect(ride).to.deep.equal(await rideModel.findOneById(rideObjectId));
      expect(rider).to.deep.equal(await riderModel.findOneById(ride.rider_id));
      expect(infoSpy.args.slice(-2)).to.deep.equal([
        [
          {
            ride_id: '111111111111111111111110',
            rider_id: '000000000000000000000001',
            amount: 10
          },
          '[worker.handleRideCompletedEvent] Received user ride completed event'
        ],
        [
          { ride_id: '111111111111111111111110' },
          '[worker.handleRideCompletedEvent] Ride already completed'
        ]
      ]);
    });

    it('set the ride as complete if it already exists', async () => {
      await rideModel.insertOne({
        _id: rideObjectId,
        rider_id: riderObjectId,
        amount: 10,
        created_at: date,
        state: 'created'
      });

      await publish('ride.completed', message);

      const ride = await rideModel.findOneById(rideObjectId);
      expect(ride).to.deep.equal({
        _id: rideObjectId,
        rider_id: riderObjectId,
        amount: 10,
        created_at: date,
        state: 'completed'
      });
      expect(infoSpy.args).to.deep.equal([
          [
            {
              "ride_id": "111111111111111111111110",
              "rider_id": "000000000000000000000001",
              "amount": 10
            },
            "[worker.handleRideCompletedEvent] Received user ride completed event"
          ],
          [
            {
              "rider_id": "000000000000000000000001"
            },
            "[worker.handleRideCompletedEvent] Rider does not exists: insert him"
          ],
          [
            {
              "ride_id": "111111111111111111111110",
              "rider_id": "000000000000000000000001",
              "rider_update": {
                "ride_count": 1,
                "points": 10,
                "status": "bronze"
              }
            },
            "[worker.handleRideCompletedEvent] Update rider"
          ]
      ]);
    });

    it('saves ride in db then completes it if it does not exist', async () => {
      await riderModel.insertOne(riderBefore);

      await publish('ride.completed', message);

      const ride = await rideModel.findOneById(rideObjectId);
      expect(ride).to.deep.equal({
        _id: rideObjectId,
        rider_id: riderObjectId,
        amount: 10,
        created_at: date,
        state: 'completed'
      });

      expect(infoSpy.args).to.deep.equal([
        [
          {
            ride_id: rideId,
            rider_id: riderId,
            amount: 10
          },
          '[worker.handleRideCompletedEvent] Received user ride completed event'
        ],
        [
          {
            ride_id: rideId,
            rider_id: riderId
          },
          '[worker.handleRideCompletedEvent] Insert ride'
        ],
        [
          {
            ride_id: rideId,
            rider_id: riderId,
            rider_update: {
              ride_count: 50,
              points: 1630,
              status: 'gold'
            }
          },
          '[worker.handleRideCompletedEvent] Update rider'
        ]
      ]);
    });

    it('also inserts rider in db if he does not exist', async () => {
      await publish('ride.completed', message);

      const rider = await riderModel.findOneById(riderObjectId);
      expect(rider).to.deep.equal({
        _id: riderObjectId,
        status: 'bronze',
        ride_count: 1,
        points: 10,
        created_at: date
      });

      const ride = await rideModel.findOneById(rideObjectId);
      expect(ride).to.deep.equal({
        _id: rideObjectId,
        rider_id: riderObjectId,
        amount: 10,
        created_at: date,
        state: 'completed'
      });

      expect(infoSpy.args).to.deep.equal([
        [
          {
            ride_id: rideId,
            rider_id: riderId,
            amount: 10
          },
          '[worker.handleRideCompletedEvent] Received user ride completed event'
        ],
        [
          { rider_id: riderId },
          '[worker.handleRideCompletedEvent] Rider does not exists: insert him'
        ],
        [
          {
            ride_id: rideId,
            rider_id: riderId
          },
          '[worker.handleRideCompletedEvent] Insert ride'
        ],
        [
          {
            ride_id: rideId,
            rider_id: riderId,
            rider_update: {
              ride_count: 1,
              points: 10,
              status: 'bronze'
            }
          },
          '[worker.handleRideCompletedEvent] Update rider'
        ]
      ]);
    });
  });
});
