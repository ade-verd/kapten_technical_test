'use strict';

const { expect } = require('chai');
const request = require('supertest');
const sinon = require('sinon');

const { start, stop } = require('../../src/app');
const riders = require('../../src/models/riders');
const rides = require('../../src/models/rides');

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
    await rides.collection().remove({});
  });

  afterEach(() => sandbox.restore());

  describe('GET /loyalty/:rider_id', () => {
    it('returns 400 if rider id is invalid', async () => {
      const { body, status } = await request(app).get(
        '/api/rider/loyalty/invalid_id',
      );

      expect({ body, status }).to.deep.equal({ body: {}, status: 400 });
    });

    it('returns 404 if rider is not found', async () => {
      const { body, status } = await request(app).get(
        `/api/rider/loyalty/${riderId}`,
      );

      expect({ body, status }).to.deep.equal({ body: {}, status: 404 });
    });

    it('returns rider status with no rides', async () => {
      await riders.insertOne({
        _id: riderId,
        name: 'Test user',
        status: 'silver',
      });

      const { body, status } = await request(app).get(
        `/api/rider/loyalty/${riderId}`,
      );

      expect({ body, status }).to.deep.equal({
        status: 200,
        body: {
          _id: riderId,
          name: 'Test user',
          status: 'silver',
          rides: 0,
          loyaltyPoints: 0,
        },
      });
    });

    it('returns rider loyalties with two rides', async () => {
      await riders.insertOne({
        _id: riderId,
        name: 'Test user',
        status: 'platinum',
      });

      await rides.insertOne({
        _id: '100000000000000000000001',
        rider_id: riderId,
        amount: 20,
        status: 'gold',
        loyalty: 100,
      });
      await rides.insertOne({
        _id: '100000000000000000000002',
        rider_id: riderId,
        amount: 20,
        status: 'gold',
        loyalty: 200,
      });

      const { body, status } = await request(app).get(
        `/api/rider/loyalty/${riderId}`,
      );

      expect({ body, status }).to.deep.equal({
        status: 200,
        body: {
          _id: riderId,
          name: 'Test user',
          status: 'platinum',
          rides: 2,
          loyaltyPoints: 300,
        },
      });
    });
  });
});
