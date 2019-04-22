'use strict';

const { expect } = require('chai');
const sinon = require('sinon');
const { ObjectId } = require('mongodb');

const dateLib = require('../../src/lib/date');
const mongodb = require('../../src/lib/mongodb');
const rides = require('../../src/models/rides');

describe('models/rides', () => {
  const sandbox = sinon.sandbox.create();
  const date = new Date('2018-01-01T12:00:00');

  before(async () => {
    await mongodb.connect();
    await rides.createIndexes();
  });

  beforeEach(async () => {
    await rides.collection().remove({});
    sandbox.stub(dateLib, 'getDate').returns(date);
  });

  afterEach(() => sandbox.restore());

  after(async () => {
    await mongodb.disconnect();
  });

  describe('#insertOne', () => {
    it('inserts a new ride record into the database', async () => {
      const ride = await rides.insertOne({
        _id: '100000000000000000000000',
        rider_id: '000000000000000000000001',
        amount: 20,
        status: 'bronze',
        loyalty: 20,
      });

      expect(ride).to.deep.equal({
        _id: ObjectId.createFromHexString('100000000000000000000000'),
        rider_id: ObjectId.createFromHexString('000000000000000000000001'),
        amount: 20,
        status: 'bronze',
        loyalty: 20,
        finished_at: date,
      });

      const dbRides = await rides
        .collection()
        .find()
        .toArray();
      expect(dbRides).to.deep.equal([
        {
          _id: ObjectId.createFromHexString('100000000000000000000001'),
          rider_id: ObjectId.createFromHexString('000000000000000000000001'),
          amount: 20,
          status: 'bronze',
          loyalty: 20,
          finished_at: date,
        },
      ]);
    });

    it('does not insert a document failing validation', async () => {
      let error;

      try {
        await rides.insertOne({
          _id: '100000000000000000000001',
          rider_id: '000000000000000000000001',
          amount: -2,
          status: 'bronze',
          loyalty: 0,
          finished_at: date,
        });
      } catch (err) {
        error = err;
      }

      expect(error)
        .to.be.an('Error')
        .with.property('message')
        .that.matches(/"name" length must be at least 6 characters long/);
    });
  });

/*  describe('#updateOne', () => {
    it('updates nothing if rider does not exists', async () => {
      const rider = await riders.updateOne(
        ObjectId.createFromHexString('000000000000000000000001'),
        {
          status: 'bronze',
        },
      );

      expect(rider.result.nModified).to.equal(0);
      const dbRiders = await riders
        .collection()
        .find()
        .toArray();
      expect(dbRiders).to.deep.equal([]);
    });

    it.skip('updates the model accordingly', async () => {
      await riders.insertOne({
        _id: '000000000000000000000001',
        name: 'Test User',
        status: 'bronze',
      });

      const riderUpdated = await riders.updateOne(
        ObjectId.createFromHexString('000000000000000000000001'),
        {
          status: 'platinum',
        },
      );

      expect(riderUpdated.result.nModified).to.equal(1);

      const dbRiders = await riders
        .collection()
        .find()
        .toArray();
      expect(dbRiders).to.deep.equal([
        {
          _id: ObjectId.createFromHexString('000000000000000000000001'),
          name: 'Test User',
          status: 'platinum',
          created_at: date,
        },
      ]);
    });
  });

  describe('#find', () => {
    beforeEach(async () => {
      await riders.collection().insertMany([
        {
          _id: ObjectId.createFromHexString('000000000000000000000001'),
          name: 'Test User',
          status: 'bronze',
          created_at: date,
        },
        {
          _id: ObjectId.createFromHexString('000000000000000000000002'),
          name: 'Silver User',
          status: 'silver',
          created_at: date,
        },
        {
          _id: ObjectId.createFromHexString('000000000000000000000003'),
          name: 'Gold User',
          status: 'gold',
          created_at: date,
        },
      ]);
    });

    it('finds all riders', async () => {
      const results = await riders.find().toArray();
      expect(results).to.deep.equal([
        {
          _id: ObjectId.createFromHexString('000000000000000000000001'),
          name: 'Test User',
          status: 'bronze',
          created_at: date,
        },
        {
          _id: ObjectId.createFromHexString('000000000000000000000002'),
          name: 'Silver User',
          status: 'silver',
          created_at: date,
        },
        {
          _id: ObjectId.createFromHexString('000000000000000000000003'),
          name: 'Gold User',
          status: 'gold',
          created_at: date,
        },
      ]);
    });

    it('finds all riders matching a query', async () => {
      const results = await riders.find({ status: 'bronze' }).toArray();
      expect(results).to.deep.equal([
        {
          _id: ObjectId.createFromHexString('000000000000000000000001'),
          name: 'Test User',
          status: 'bronze',
          created_at: date,
        },
      ]);
    });

    it('applies the projection', async () => {
      const results = await riders.find({}, { status: 1 }).toArray();
      expect(results).to.deep.equal([
        {
          _id: ObjectId.createFromHexString('000000000000000000000001'),
          status: 'bronze',
        },
        {
          _id: ObjectId.createFromHexString('000000000000000000000002'),
          status: 'silver',
        },
        {
          _id: ObjectId.createFromHexString('000000000000000000000003'),
          status: 'gold',
        },
      ]);
    });
  });

  describe('#findOneById', () => {
    beforeEach(async () => {
      await riders.insertOne({
        _id: '000000000000000000000001',
        name: 'Test User',
        status: 'bronze',
        created_at: date,
      });
    });

    it('finds a rider by id', async () => {
      const results = await riders.findOneById(
        ObjectId.createFromHexString('000000000000000000000001'),
      );

      expect(results).to.deep.equal({
        _id: ObjectId.createFromHexString('000000000000000000000001'),
        name: 'Test User',
        status: 'bronze',
        created_at: date,
      });
    });

    it('applies the projections', async () => {
      const results = await riders.findOneById(
        ObjectId.createFromHexString('000000000000000000000001'),
        { name: 1 },
      );

      expect(results).to.deep.equal({
        _id: ObjectId.createFromHexString('000000000000000000000001'),
        name: 'Test User',
      });
    });
  });*/
});