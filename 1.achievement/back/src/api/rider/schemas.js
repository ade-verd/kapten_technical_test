'use strict';

const Joi = require('../../lib/joi');

const getLoyaltyInfoSchema = Joi.object().keys({
  rider_id: Joi.objectId().required(),
});

module.exports = { getLoyaltyInfoSchema };
