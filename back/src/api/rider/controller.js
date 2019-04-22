'use strict';

const HttpStatus = require('http-status-codes');
const logger = require('chpr-logger');
const { ObjectId } = require('mongodb');

const Joi = require('../../lib/joi');
const riders = require('../../models/riders');
const rides = require('../../models/rides');

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

  var rider = await riders.findOneById(riderId, { name: 1, status: 1 });
  if (!rider) {
    logger.info(
      { rider_id: riderId },
      '[loyalty#getLoyaltyInfo] User does not exist',
    );
    return res.sendStatus(HttpStatus.NOT_FOUND);
  }
  
  const ride = await rides.find({ rider_id: riderId }).toArray();
  if (!ride) {
    logger.info(
      { rider_id: riderId },
      '[loyalty#getLoyaltyInfo] Rides Query error',
    );
    return res.sendStatus(HttpStatus.BAD_REQUEST);
  }
  rider.rides = ride.length;

  if (rider.rides === 0) {
    rider.loyaltyPoints = 0;
  } else {
    const pointsArray = await rides.collection().aggregate([
      { $match: { "rider_id": ObjectId(riderId) }}, 
      { $group: { _id: "$rider_id", points: { $sum: "$loyalty" } }}
    ]).toArray();
    if (!pointsArray) {
      logger.info(
        { rider_id: riderId },
        '[loyalty#getLoyaltyInfo] Loyalty Points Query error',
      );
      return res.sendStatus(HttpStatus.BAD_REQUEST);
    }
    rider.loyaltyPoints = pointsArray[0].points;
  }

  return res.send(rider);
}

module.exports = {
  getLoyaltyInfo,
};
