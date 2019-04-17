'use strict';

const { expect } = require('chai');
const request = require('supertest');
const sinon = require('sinon');

const { start, stop } = require('../../src/app');
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

    it('returns rider status', async () => {
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
        },
      });
    });
  });
});
