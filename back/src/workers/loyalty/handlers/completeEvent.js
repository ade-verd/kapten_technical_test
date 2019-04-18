'use strict';

const logger = require('chpr-logger');

const { handleMessageError } = require('../../../lib/workers');
const rideModel = require('../../../models/rides');

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

  try {
    logger.info(
      { id: rideId, amount, rider_id: riderId },
      '[worker.handleCompleteEvent] Complete Ride',
    );
    await rideModel.insertOne({
      _id: rideId,
      amount,
      rider_id: riderId,
    });
  } catch (err) {
    handleMessageError(err, message, messageFields);
  }
}

module.exports = handleCompleteEvent;
