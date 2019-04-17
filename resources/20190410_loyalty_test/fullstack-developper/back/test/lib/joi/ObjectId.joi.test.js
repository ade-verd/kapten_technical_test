'use strict';

const { expect } = require('chai');
const { ObjectID } = require('mongodb');

const Joi = require('../../../src/lib/joi');

describe('lib/joi', () => {
  describe('#ObjectId', () => {
    const schema = Joi.objectId();

    it('should validate with an undefined field', () => {
      const res = Joi.attempt(undefined, schema);
      expect(res).to.be.undefined();
    });

    it('should throw with an undefined ObjectID but required', () => {
      const res = Joi.validate(undefined, schema.required());
      expect(res.error).to.have.property('message', '"value" is required');
    });

    it('should throw with an invalid ObjectID', () => {
      const res = Joi.validate('qwertyuiop', schema);
      expect(res.error).to.have.property(
        'message',
        '"value" must be a valid ObjectID',
      );
    });

    it('should validate with a valid ObjectID as string', () => {
      const res = Joi.attempt('584568fc413029a2d7a7a3cf', schema);
      expect(res).to.deep.equal(
        ObjectID.createFromHexString('584568fc413029a2d7a7a3cf'),
      );
    });

    it('should validate with a valid ObjectID as ObjectID', () => {
      const res = Joi.attempt(
        ObjectID.createFromHexString('584568fc413029a2d7a7a3cf'),
        schema,
      );
      expect(res).to.deep.equal(
        ObjectID.createFromHexString('584568fc413029a2d7a7a3cf'),
      );
    });
  });
});
