'use strict';

const logger = require('chpr-logger');
const { ObjectId } = require('mongodb');

const { handleMessageError } = require('../../../lib/workers');
const rideModel = require('../../../models/rides');
const riderModel = require('../../../models/riders');
const { loyaltyCoef } = require('../../../constants/loyalty');
const { loyaltyStatuses } = require('../../../constants/loyalty');

/**
 * Bus message handler for user signup events
 *
 * @param   {Object} message The bus message object.
 * @param   {Object} messageFields The bus message metadata.
 * @returns {void}
 */
async function handleCompleteEvent(message, messageFields) {
  const { id: rideId, amount, rider_id: riderId } = message.payload;

  logger.info(
    { id: rideId, amount, rider_id: riderId },
    '[worker.handleCompleteEvent] Received completed ride event',
  );

  // TODO handle idempotency
  const ridesIdArray = await rideModel.find({ _id: ObjectId.createFromHexString(rideId) }).toArray();
  if (ridesIdArray.length > 0) {
    logger.error(
      { checkError: "Ride is already completed", message, messageFields },
      '[worker.handleCompleteEvent] This ride is already completed. Operation aborted',
    );
    throw new Error('Ride is already completed');
  }
  
  const riderArray = await riderModel.find({ _id: ObjectId.createFromHexString(riderId) }).toArray();
  if (riderArray.length === 0)
  {
    logger.error(
      { checkError: "Rider does not exist", message, messageFields },
      '[worker.handleCompleteEvent] Rider does not exist. Register first. Operation aborted',
    );
    throw new Error('Rider does not exist');
  }

  const { status } = riderArray[0]; // destructuring form of: status = riderArray[0].status
  const { coef } = loyaltyCoef[status]; // destructuring form of: coef = loyaltyCoef[status].coef

  const loyaltyPoints = Math.floor(amount) * coef;

  try {
    logger.info(
      { id: rideId, amount, rider_id: riderId, loyalty: loyaltyPoints },
      '[worker.handleCompleteEvent] Complete Ride',
    );
    await rideModel.insertOne({
      _id: rideId,
      amount,
      rider_id: riderId,
      status,
      loyalty: loyaltyPoints,
    });
    await updateStatus(riderId, status);

  } catch (err) {
    handleMessageError(err, message, messageFields);
  }
}

/**
 * Check if the current status has to be updated and eventually update it.
 *
 * @param   {Object} riderId id of the rider.
 * @param   {Object} currentStatus current status of the rider.
 * @returns {void}
 */
async function updateStatus(riderId, currentStatus)
{
  const ridesArray = await rideModel.find({ rider_id: ObjectId.createFromHexString(riderId) }).toArray();
  const ridesNb = ridesArray.length;

  let newStatus = loyaltyStatuses[0];
  for (let i = 0; i < loyaltyStatuses.length; i += 1) {
    const status = loyaltyStatuses[i];
    if (ridesNb >= loyaltyCoef[status].rides) {
      newStatus = status;
    }
  }

  const infos = { riderId, currentStatus, newStatus, ridesNb };

  if (newStatus !== currentStatus) {
    try {
      logger.info(
        infos,
        '[worker.updateStatus] Status updated',
      );
      await riderModel.updateOne(
        ObjectId.createFromHexString(riderId),
        { status: newStatus },
      );
    } catch (err) {
      logger.error(
        {err, infos}, 
        '[worker.updateStatus] Status update failed',
      );
      throw err;
    }
  }
}


module.exports = handleCompleteEvent;
