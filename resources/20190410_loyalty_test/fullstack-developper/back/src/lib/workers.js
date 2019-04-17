'use strict';

const logger = require('chpr-logger');

/**
 * Handle errors from the bus consumer: redelivers the message once then drops
 * it if it fails again.
 *
 * @param   {Error} err The error.
 * @param   {Object} message The bus message.
 * @param   {Object} messageFields The bus message metadata.
 * @returns {void}
 */
function handleMessageError(err, message, messageFields) {
  if (messageFields && messageFields.redelivered) {
    logger.error(
      { err, message, messageFields },
      '[worker.handleMessageError] Could not handle message for the second time, dropping it',
    );
  }

  throw err;
}

module.exports = {
  handleMessageError,
};
