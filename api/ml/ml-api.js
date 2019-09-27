'use strict';

const express = require('express');
const bodyParser = require('body-parser');

const router = express.Router();

// Automatically parse request body as JSON
router.use(bodyParser.json());

router.get('/', (req, res, next) => {
  res.json({ message: '[GET] /api/ml' });
});

/**
 * Errors on "/api/ml/*" routes.
 */
router.use((err, req, res, next) => {
  // Format error and forward to generic error handler for logging and
  // responding to the request
  err.response = {
    message: err.message,
    internalCode: err.code
  };
  next(err);
});

module.exports = router;
