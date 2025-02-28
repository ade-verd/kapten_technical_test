'use strict';

const logger = require('chpr-logger');
const { ObjectId } = require('mongodb');

const { handleMessageError } = require('../../../lib/workers');
const riderModel = require('../../../models/riders');

/**
 * Bus message handler for user signup events
 *
 * @param   {Object} message The bus message object.
 * @param   {Object} messageFields The bus message metadata.
 * @returns {void}
 */
async function handleSignupEvent(message, messageFields) {
  const { id: riderId, name } = message.payload;
  const idQuery = await riderModel.find({
    _id: ObjectId.createFromHexString(riderId),
  }).toArray();

  logger.info(
    { rider_id: riderId, name },
    '[worker.handleSignupEvent] Received user signup event',
  );
   
  // TODO handle idempotency
  if (idQuery.length > 0) {
    logger.error(
      { checkError: "Rider already exists", message, messageFields },
      '[worker.handleSignupEvent] Rider already exists. Creation aborted',
    );
    throw new Error('Rider already exists');
  }

  try {
    logger.info(
      { rider_id: riderId, name },
      '[worker.handleSignupEvent] Insert rider',
    );
    await riderModel.insertOne({
      _id: riderId,
      name,
    });
  } catch (err) {
    handleMessageError(err, message, messageFields);
  }
}

module.exports = handleSignupEvent;
