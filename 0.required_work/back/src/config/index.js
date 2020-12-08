'use strict';

module.exports = {
  port: process.env.PORT || 8000,
  mongodb: {
    name: 'loyalty',
    url: process.env.MONGO_URL || 'mongodb://localhost:27017/temp',
    options: {},
  },
  amqp: {
    exchange: process.env.AMQP_MAIN_EXCHANGE || 'events',
    url: process.env.AMQP_URL || 'amqp://guest:guest@localhost:5672',
  },
};
