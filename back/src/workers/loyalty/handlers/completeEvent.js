'use strict';

const logger = require('chpr-logger');

const { handleMessageError } = require('../../../lib/workers');
const riderModel = require('../../../models/rides');

/**
 * Bus message handler for user signup events
 *
 * @param   {Object} message The bus message object.
 * @param   {Object} messageFields The bus message metadata.
 * @returns {void}
 */
async function handleCompleteEvent(message, messageFields) {
  const { id: idRide, amount, idRider } = message.payload;

  logger.info(
    { idRide, amount, idRider },
    '[worker.handleCompleteEvent] Received completed ride event',
  );

  // TODO handle idempotency

  try {
    logger.info(
      { idRide, amount, idRider },
      '[worker.handleCompleteEvent] Complete Ride',
    );
    await riderModel.insertOne({
      _id: idRide,
      id_rider: idRider,
      amount: amount,
    });
  } catch (err) {
    handleMessageError(err, message, messageFields);
  }
}

module.exports = handleCompleteEvent;
