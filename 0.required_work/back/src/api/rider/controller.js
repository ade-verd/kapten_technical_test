'use strict';

const HttpStatus = require('http-status-codes');
const logger = require('chpr-logger');

const Joi = require('../../lib/joi');
const riders = require('../../models/riders');

const { getLoyaltyInfoSchema } = require('./schemas');

/**
 * Get current rider status
 *
 * @param {Object} req express request
 * @param {Object} res express response
 *
 * @returns {Object} response
 */
async function getLoyaltyInfo(req, res) {
  const { error, value: validatedParams } = Joi.validate(
    req.params,
    getLoyaltyInfoSchema,
  );

  if (error) {
    logger.error({ error }, '[loyalty#getLoyaltyInfo] Error: invalid body');
    return res.sendStatus(HttpStatus.BAD_REQUEST);
  }

  const { rider_id: riderId } = validatedParams;
  logger.info(
    { rider_id: riderId },
    '[loyalty#getLoyaltyInfo] Rider info requested',
  );

  const rider = await riders.findOneById(riderId, { name: 1, status: 1 });
  if (!rider) {
    logger.info(
      { rider_id: riderId },
      '[loyalty#getLoyaltyInfo] User does not exist',
    );
    return res.sendStatus(HttpStatus.NOT_FOUND);
  }

  return res.send(rider);
}

module.exports = {
  getLoyaltyInfo,
};
