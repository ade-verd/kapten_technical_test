'use strict';

const { Router } = require('express');

const riderRouter = require('./rider');

module.exports = function addRouter(app) {
  const router = Router();
  router.use('/rider', riderRouter);
  app.use('/api', router);
};
