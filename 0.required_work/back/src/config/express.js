'use strict';

const bodyParser = require('body-parser');
const express = require('express');

const config = require('../config');
const api = require('../api');

/**
 * Configure the Express app with default configuration
 *
 * @export
 * @param {Express} app application
 * @returns {Object} Configured Express application
 */
function configure(app) {
  /** Body parser */
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());

  /** prevent CORS failures for this test */
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept',
    );
    next();
  });

  /** Apidoc */
  app.use('/apidoc', express.static('apidoc'));

  /** Set-up routes */
  api(app);

  /**  App configuration. */
  app.set('port', config.port);
  return app;
}

module.exports = {
  configure,
};
