const { expect } = require('chai');
const sinon = require('sinon');
const _ = require('lodash');
const amqplib = require('amqplib');
const { ObjectId } = require('mongodb');
const logger = require('chpr-logger');

const riderModel = require('../../src/models/riders');
const rideModel = require('../../src/models/rides');
const dateLib = require('../../src/lib/date');
const riders = require('../../src/models/riders');
const rides = require('../../src/models/rides');
const { loyaltyCoef } = require('../../src/constants/loyalty');
const {
  start: startWorker,
  stop: stopWorker,
} = require('../../src/workers/loyalty');

const exchangeName = 'events';
let channel;

/**
 * Publish a message on an AMQP queue
 * @param {String} routingKey routing key to publish to
 * @param {Object} payload the message payload
 * @returns {Promise<void>}
 */
async function publish(routingKey, payload) {
  const message = new Buffer(JSON.stringify(payload));
  await channel.publish(exchangeName, routingKey, message);
}

describe('workers/loyalty', () => {
  const amqpUrl = 'amqp://guest:guest@localhost:5672';
  const date = new Date('2018-01-01T12:00:00');
  const sandbox = sinon.sandbox.create();
  let connection;
  let worker;

  before(async () => {
    connection = await amqplib.connect(amqpUrl);
    channel = await connection.createChannel();
    await channel.deleteQueue('loyaltyQueue');
    worker = await startWorker();
    await riders.createIndexes();
    await rides.createIndexes();
  });

  beforeEach(async () => {
    await channel.assertExchange(exchangeName, 'topic');
    await riderModel.collection().remove({});
    await rideModel.collection().remove({});
    sandbox.stub(dateLib, 'getDate').returns(date);
  });

  afterEach(async () => {
    sandbox.restore();
  });

  after(async () => {
    await stopWorker();
    await channel.deleteQueue('loyaltyQueue');
    await channel.deleteExchange(exchangeName);
    await connection.close();
  });

  describe('#handleSignupEvent', () => {
    const message = {
      type: 'rider_signed_up',
      payload: {
        id: '000000000000000000000001',
        name: 'John Doe',
      },
    };

    it('saves rider in db when message is valid', async () => {
      await publish('rider.signup', message);
      await worker.wait(worker.TASK_COMPLETED);

      const riders = await riderModel.find().toArray();
      expect(riders).to.deep.equal([
        {
          _id: ObjectId.createFromHexString('000000000000000000000001'),
          name: 'John Doe',
          status: 'bronze',
          created_at: date,
        },
      ]);
    });

    it('does not try to save user if he is already saved in db', async () => {
      // TODO : implement this behavior
      const errorSpy = sandbox.spy(logger, 'error');

      await riderModel.insertOne({ 
        _id: message.payload.id,
        name:message.payload.id
      });
      
      await publish('rider.signup', message);
      await worker.wait(worker.TASK_FAILED);
      
      const riders = await riderModel.find().toArray();
      expect(riders.length).to.equal(1);
      expect(errorSpy.callCount).to.be.at.least(1);
      expect(errorSpy.args[0][1]).to.equal(
        '[worker.handleSignupEvent] Rider already exists. Creation aborted',
      );
    });
    
    it('tries a second time then drops message if error during rider insertion', async () => {
      const error = new Error('insertion error');
      sandbox.stub(riderModel, 'insertOne').rejects(error);
      const errorSpy = sandbox.spy(logger, 'error');

      await publish('rider.signup', message);
      await worker.wait(worker.TASK_FAILED);

      const riders = await riderModel.find().toArray();
      expect(riders).to.deep.equal([]);
      expect(errorSpy.callCount).to.equal(1);
      expect(errorSpy.args[0][1]).to.equal(
        '[worker.handleMessageError] Could not handle message for the second time, dropping it',
      );
    });

    it('fails validation if no id in message', async () => {
      await publish('rider.signup', _.omit(message.payload, 'id'));
      await worker.wait(worker.TASK_FAILED);

      const riders = await riderModel.find().toArray();
      expect(riders).to.deep.equal([]);
    });

    it('fails validation if id is not a valid ObjectId', async () => {
      await publish('rider.signup', {
        type: message.type,
        payload: { ...message.payload, id: 'not valid' },
      });
      await worker.wait(worker.TASK_FAILED);

      const riders = await riderModel.find().toArray();
      expect(riders).to.deep.equal([]);
    });

    it('fails validation if no name in message', async () => {
      await publish('rider.signup', _.omit(message.payload, 'name'));
      await worker.wait(worker.TASK_FAILED);

      const riders = await riderModel.find().toArray();
      expect(riders).to.deep.equal([]);
    });

    it('fails validation if name contains less than 6 letters', async () => {
      await publish('rider.signup', {
        type: message.type,
        payload: { ...message.payload, name: 'short' },
      });
      await worker.wait(worker.TASK_FAILED);

      const riders = await riderModel.find().toArray();
      expect(riders).to.deep.equal([]);
    });
  });
  
  describe('#handleCompleteEvent', () => {
    const message = {
      type: 'ride_completed',
      payload: {
        id: '100000000000000000000000',
        rider_id: '000000000000000000000001',
        amount: 20,
      },
    };

    beforeEach(async () => {
      await riders.insertOne({
        _id: message.payload.rider_id,
        name: 'Test User',
        status: 'bronze',
      });
    });

    it('saves ride in db when message is valid', async () => {
      await publish('ride.completed', message);
      await worker.wait(worker.TASK_COMPLETED);

      const rides = await rideModel.find().toArray();
      expect(rides).to.deep.equal([
        {
          _id: ObjectId.createFromHexString('100000000000000000000000'),
          rider_id: ObjectId.createFromHexString('000000000000000000000001'),
          amount: 20,
          status: 'bronze',
          loyalty: 20,
          finished_at: date,
        },
      ]);
    });

    it('does not try to save ride if it is already saved in db', async () => {
      const errorSpy = sandbox.spy(logger, 'error');
      
      await rideModel.insertOne({ 
        _id: message.payload.id,
        rider_id: message.payload.rider_id,
        amount: 20,
        status: 'bronze',
        loyalty: 20,
      });
      
      await publish('ride.completed', message);
      await worker.wait(worker.TASK_FAILED);
      
      const rides = await rideModel.find().toArray();
      expect(rides.length).to.equal(1);
      expect(errorSpy.args[0][1]).to.equal(
        '[worker.handleCompleteEvent] This ride is already completed. Operation aborted',
      );
    });
    
    it('tries a second time then drops message if error during rider insertion', async () => {
      const error = new Error('insertion error');
      sandbox.stub(rideModel, 'insertOne').rejects(error);
      const errorSpy = sandbox.spy(logger, 'error');
      
      await publish('ride.completed', message);
      await worker.wait(worker.TASK_FAILED);

      const rides = await rideModel.find().toArray();
      expect(rides).to.deep.equal([]);
      expect(errorSpy.callCount).to.equal(1);
      expect(errorSpy.args[0][1]).to.equal(
        '[worker.handleMessageError] Could not handle message for the second time, dropping it',
      );
    });

    it('fails validation if no id in message', async () => {
      await publish('ride.completed', _.omit(message.payload, 'id'));
      await worker.wait(worker.TASK_FAILED);

      const rides = await rideModel.find().toArray();
      expect(rides).to.deep.equal([]);
    });

    it('fails validation if no rider_id in message', async () => {
      await publish('ride.completed', _.omit(message.payload, 'rider_id'));
      await worker.wait(worker.TASK_FAILED);

      const rides = await rideModel.find().toArray();
      expect(rides).to.deep.equal([]);
    });

    it('fails validation if no amount in message', async () => {
      await publish('ride.completed', _.omit(message.payload, 'amount'));
      await worker.wait(worker.TASK_FAILED);

      const rides = await rideModel.find().toArray();
      expect(rides).to.deep.equal([]);
    });

    it('fails validation if id is not a valid ObjectId (test with rideId)', async () => {
      await publish('ride.completed', {
        type: message.type,
        payload: { ...message.payload, id: 'not valid' },
      });
      await worker.wait(worker.TASK_FAILED);

      const rides = await rideModel.find().toArray();
      expect(rides).to.deep.equal([]);
    });

    it('fails validation if id is not a valid ObjectId (test with riderId)', async () => {
      await publish('ride.completed', {
        type: message.type,
        payload: { ...message.payload, rider_id: 'not valid' },
      });
      await worker.wait(worker.TASK_FAILED);

      const rides = await rideModel.find().toArray();
      expect(rides).to.deep.equal([]);
    });

    it('fails validation if amount is negative', async () => {
      await publish('ride.completed', {
        type: message.type,
        payload: { ...message.payload, amount: -2 },
      });
      await worker.wait(worker.TASK_FAILED);

      const rides = await rideModel.find().toArray();
      expect(rides).to.deep.equal([]);
    });

    it('fails validation if rider is not registered', async() => {
      // some events are in the wrong order (ride create before rider signup)
      const errorSpy = sandbox.spy(logger, 'error');
      await riderModel.collection().remove({});

      await publish('ride.completed', message);
      await worker.wait(worker.TASK_FAILED);

      expect(errorSpy.callCount).to.be.at.least(1);
      expect(errorSpy.args[0][1]).to.equal(
        '[worker.handleCompleteEvent] Rider does not exists. Register first. Operation aborted',
      );
    });
    
    it('updates status at the right moment (19 rides: bronze)', async() => {
      for (var i = 0; i < (loyaltyCoef.silver.rides - 1); i++) {
        var amount = 3 + Math.floor(Math.random() * Math.floor(50));

        await rideModel.insertOne({ 
          _id: new ObjectId(),
          rider_id: message.payload.rider_id,
          amount: amount,
          status: 'bronze',
          loyalty: (amount * loyaltyCoef.bronze.coef),
        });
      }

      const rides = await rideModel.find().toArray();
      expect(rides.length).to.equal(loyaltyCoef.silver.rides - 1);

      const rider = await riderModel.findOneById(
        ObjectId.createFromHexString(message.payload.rider_id),
        { status: 1 },
      );
      expect(rider).to.deep.equal({
        _id: ObjectId.createFromHexString(message.payload.rider_id),
        status: 'bronze',
      });
    });
      
    it('updates status at the right moment (20 rides: bronze to silver)', async() => {
      for (var i = 0; i < (loyaltyCoef.silver.rides - 1); i++) {
        await rideModel.insertOne({ 
          _id: new ObjectId(),
          rider_id: message.payload.rider_id,
          amount: 20,
          status: 'bronze',
          loyalty: 20,
        });
      }

      await publish('ride.completed', message);
      await worker.wait(worker.TASK_COMPLETED);

      const rides = await rideModel.find().toArray();
      expect(rides.length).to.equal(loyaltyCoef.silver.rides);

      const rider = await riderModel.findOneById(
        ObjectId.createFromHexString(message.payload.rider_id),
        { status: 1 },
      );
      expect(rider).to.deep.equal({
        _id: ObjectId.createFromHexString(message.payload.rider_id),
        status: 'silver',
      });
    });

    it('updates status at the right moment (49 rides: silver)', async() => {
      for (var i = 0; i < (loyaltyCoef.gold.rides - 2); i++) {
        await rideModel.insertOne({ 
          _id: new ObjectId(),
          rider_id: message.payload.rider_id,
          amount: 20,
          status: 'bronze',
          loyalty: 20,
        });
      }
      
      await publish('ride.completed', message);
      await worker.wait(worker.TASK_COMPLETED);

      const rides = await rideModel.find().toArray();
      expect(rides.length).to.equal(loyaltyCoef.gold.rides - 1);

      const rider = await riderModel.findOneById(
        ObjectId.createFromHexString(message.payload.rider_id),
        { status: 1 },
      );
      expect(rider).to.deep.equal({
        _id: ObjectId.createFromHexString(message.payload.rider_id),
        status: 'silver',
      });
    });

    it('updates status at the right moment (50 rides: silver to gold)', async() => {
      for (var i = 0; i < (loyaltyCoef.gold.rides - 1); i++) {
        await rideModel.insertOne({
          _id: new ObjectId(),
          rider_id: message.payload.rider_id,
          amount: 20,
          status: 'bronze',
          loyalty: 20,
        });
      }

      await publish('ride.completed', message);
      await worker.wait(worker.TASK_COMPLETED);

      const rides = await rideModel.find().toArray();
      expect(rides.length).to.equal(loyaltyCoef.gold.rides);

      const rider = await riderModel.findOneById(
        ObjectId.createFromHexString(message.payload.rider_id),
        { status: 1 },
      );
      expect(rider).to.deep.equal({
        _id: ObjectId.createFromHexString(message.payload.rider_id),
        status: 'gold',
      });
    });

    it('updates status at the right moment (99 rides: gold)', async() => {
      for (var i = 0; i < (loyaltyCoef.platinum.rides - 2); i++) {
        await rideModel.insertOne({ 
          _id: new ObjectId(),
          rider_id: message.payload.rider_id,
          amount: 20,
          status: 'bronze',
          loyalty: 20,
        });
      }
      
      await publish('ride.completed', message);
      await worker.wait(worker.TASK_COMPLETED);

      const rides = await rideModel.find().toArray();
      expect(rides.length).to.equal(loyaltyCoef.platinum.rides - 1);

      const rider = await riderModel.findOneById(
        ObjectId.createFromHexString(message.payload.rider_id),
        { status: 1 },
      );
      expect(rider).to.deep.equal({
        _id: ObjectId.createFromHexString(message.payload.rider_id),
        status: 'gold',
      });
    });

    it('updates status at the right moment (100 rides: gold to platinum)', async() => {
      for (var i = 0; i < (loyaltyCoef.platinum.rides - 1); i++) {
        await rideModel.insertOne({
          _id: new ObjectId(),
          rider_id: message.payload.rider_id,
          amount: 20,
          status: 'bronze',
          loyalty: 20,
        });
      }

      await publish('ride.completed', message);
      await worker.wait(worker.TASK_COMPLETED);

      const rides = await rideModel.find().toArray();
      expect(rides.length).to.equal(loyaltyCoef.platinum.rides);

      const rider = await riderModel.findOneById(
        ObjectId.createFromHexString(message.payload.rider_id),
        { status: 1 },
      );
      expect(rider).to.deep.equal({
        _id: ObjectId.createFromHexString(message.payload.rider_id),
        status: 'platinum',
      });
    });

    it('updates status at the right moment (> 100 rides: platinum)', async() => {
      for (var i = 0; i < (loyaltyCoef.platinum.rides + 50); i++) {
        await rideModel.insertOne({
          _id: new ObjectId(),
          rider_id: message.payload.rider_id,
          amount: 20,
          status: 'bronze',
          loyalty: 20,
        });
      }

      await publish('ride.completed', message);
      await worker.wait(worker.TASK_COMPLETED);

      const rides = await rideModel.find().toArray();
      expect(rides.length).to.be.at.least(loyaltyCoef.platinum.rides);

      const rider = await riderModel.findOneById(
        ObjectId.createFromHexString(message.payload.rider_id),
        { status: 1 },
      );
      expect(rider).to.deep.equal({
        _id: ObjectId.createFromHexString(message.payload.rider_id),
        status: 'platinum',
      });
    });

  });
});
