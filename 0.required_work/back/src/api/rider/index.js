'use strict';

const express = require('express');
const wrap = require('co-express');

const controller = require('./controller');

const router = express.Router();

router.get('/loyalty/:rider_id', wrap(controller.getLoyaltyInfo));

module.exports = router;
