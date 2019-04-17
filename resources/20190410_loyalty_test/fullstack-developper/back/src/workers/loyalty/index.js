'use strict';

const co = require('co');

const logger = require('chpr-logger');
const workerLib = require('chpr-worker');

const config = require('../../config');
const mongodb = require('../../lib/mongodb');
const Joi = require('../../lib/joi');

const { handleSignupEvent } = require('./handlers');
const { signupSchema } = require('./schemas');

let worker;

/**
 * Initialize the mongo and bus connections
 *
 * @returns {Promise<*>} worker instance or null on error
 */
async function start() {
  await mongodb.connect();
  try {
    worker = workerLib.createWorkers(
      [
        {
          handle: handleSignupEvent,
          validate: message => Joi.assert(message, signupSchema),
          routingKey: 'rider.signup',
        },
        // TODO add missing workers here
      ],
      {
        workerName: 'loyaltyWorker',
        amqpUrl: config.amqp.url,
        exchangeName: config.amqp.exchange,
        queueName: 'loyaltyQueue',
      },
      {
        channelPrefetch: 100,
        taskTimeout: 30000,
        processExitTimeout: 3000,
      },
    );

    await worker.listen();
    return worker;
  } catch (err) /* istanbul ignore next */ {
    logger.error({ err }, '[worker.loyalty.listen] An error occurred');
    return null;
  }
}

/**
 * Stop the worker and close all connections
 *
 * @returns {void}
 */
async function stop() {
  /* istanbul ignore else */
  if (worker) {
    await worker.close(false);
    worker = null;
  }
  await mongodb.disconnect();
}

/* istanbul ignore if */
if (!module.parent) {
  co(start);
}

module.exports = {
  start,
  stop,
};
