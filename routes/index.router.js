'use strict';

const express = require('express');
const cors = require('cors');

const router = express.Router();

router.options('/', cors());

router.get('/', cors(), (req, res, next) => {
  res.header('Content-Type', 'application/json');
  res.json({ message: '[GET] /api' });
});

router.get('/alive', cors(), (req, res, next) => {
  res.header('Content-Type', 'application/json');
  res.json({ message: '[GET] /api/alive' });
});

router.use('/ml', require('../api/ml/ml-api'));

router.use('/insee', require('../api/insee/insee-api'));

module.exports = router;
