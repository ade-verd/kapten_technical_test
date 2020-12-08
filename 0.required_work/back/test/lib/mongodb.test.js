'use strict';

const { expect } = require('chai');
const sinon = require('sinon');
const { Db, MongoError } = require('mongodb');

const dbLib = require('../../src/lib/mongodb');

describe('lib/mongodb', () => {
  const sandbox = sinon.sandbox.create();

  afterEach(() => sandbox.restore());

  describe('Database connection', () => {
    it('connects to the database', async () => {
      await dbLib.disconnect();
      await dbLib.connect();
      const db = dbLib.getDb();
      expect(db).to.be.instanceOf(Db);
      const stats = await db.stats();
      expect(stats.ok).to.equal(1);
    });

    it('disconnects to the database', async () => {
      let error;
      await dbLib.disconnect();
      const db = dbLib.getDb();
      try {
        await db.stats();
      } catch (err) {
        error = err;
      }
      expect(error)
        .to.be.instanceof(MongoError)
        .with.property('message', 'topology was destroyed');
    });
  });
});
