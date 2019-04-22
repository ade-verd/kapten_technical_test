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
    throw "Ride is already completed";
  }
  
  const riderArray = await riderModel.find({ _id: ObjectId.createFromHexString(riderId) }).toArray();
  const status = riderArray[0]['status'];
  const coef = loyaltyCoef[status].coef;
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
      status: status,
      loyalty: await loyaltyPoints,
    });

    await updateStatus(riderId, status);

  } catch (err) {
    handleMessageError(err, message, messageFields);
  }
}

async function updateStatus(riderId, currentStatus)
{
  console.dir("Coucouuuuu");
  const ridesArray = await rideModel.find({ rider_id: ObjectId.createFromHexString(riderId) }).toArray();
  const ridesNb = ridesArray.length;

  var newStatus = loyaltyStatuses[0];
  for (var i = 0; i < loyaltyStatuses.length; i++) {
    var status = loyaltyStatuses[i];
    if (ridesNb >= loyaltyCoef[status].rides) {
      newStatus = status;
    }
  }

  const infos = {
    riderId: riderId, 
    currentStatus: currentStatus,
    newStatus: newStatus,
    ridesNb: ridesNb,
  };

  console.dir(infos);

  if (newStatus !== currentStatus) {
    try {
      logger.info(
        infos,
        '[worker.updateStatus] Status updated',
      );
      await riderModel.updateOne(
        //riderId,
        ObjectId.createFromHexString(riderId),
        { status: newStatus },
      );
    } catch (err) {
      logger.error(
        {err, infos}, 
        '[worker.updateStatus] Status update failed',
      );
    }
  } else {
    logger.info("Status: nothing to do: ", arr);
  }

}


module.exports = handleCompleteEvent;
