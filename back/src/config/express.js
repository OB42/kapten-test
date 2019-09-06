'use strict';

const bodyParser = require('body-parser');
const express = require('express');
const expressMiddleware = require('express-middleware');
const logger = require('chpr-logger');

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
  /**
   * Heartbeat activation
   */
  app.get('/heartbeat', (req, res) => res.status(200).json({
    state: 'up'
  }));

  /** Body parser */
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());

  /** middlewares */
  app.use(expressMiddleware.requestId());
  app.use(expressMiddleware.childLogger(logger));

  /** Apidoc */
  app.use('/apidoc', express.static('apidoc'));

  /** Set-up routes */
  api(app);

  /**  App configuration. */
  app.set('port', config.port);

  return app;
}

module.exports = {
  configure
};
