'use strict';

const Joi = require('../../lib/joi');

const signupSchema = Joi.object({
  type: Joi.string().required(),
  payload: Joi.object({
    id: Joi.objectId().required(),
    name: Joi.string()
      .min(6)
      .required(),
  }),
});

const completeSchema = Joi.object({
  type: Joi.string().required(),
  payload: Joi.object({
    id: Joi.objectId().required(),
    rider_id: Joi.objectId().required(), 
    amount: Joi.number()
      .min(0)
      .precision(2)
      .required(),
  }),
});

module.exports = {
  signupSchema,
  completeSchema,
};
