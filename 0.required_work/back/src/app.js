'use strict';

const http = require('http');
const co = require('co');
const express = require('express');
const logger = require('chpr-logger');

const { configure } = require('./config/express');
const mongodb = require('./lib/mongodb');
const riders = require('./models/riders');

let app;
let server;

/**
 * Start the web app.
 *
 * @returns {Promise} when app end to start
 */
async function start() {
  if (app) {
    return app;
  }

  logger.info('Express web server creation');
  app = configure(express());
  server = http.createServer(app);
  await server.listen(app.get('port'));

  await mongodb.connect();
  await riders.createIndexes();

  logger.info(
    {
      port: server.address().port,
      environment: process.env.NODE_ENV,
    },
    '✔ Server running',
  );

  return app;
}

/**
 * Stop the web app.
 *
 * @returns {Promise} when app end to start
 */
async function stop() {
  if (server) {
    await server.close();
    server = null;
    app = null;
  }
  await mongodb.disconnect();
  return Promise.resolve();
}

if (!module.parent) {
  co(start);
}

module.exports = {
  start,
  stop,
  get server() {
    return server;
  },
  get app() {
    return app;
  },
};
