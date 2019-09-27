'use strict';

const express = require('express');
const bodyParser = require('body-parser');

const router = express.Router();

// Automatically parse request body as JSON
router.use(bodyParser.json());

router.get('/', (req, res, next) => {
  res.json({ message: '[GET] /api/ml' });
});

router.get('/models', (req, res, next) => {
  const { BigQuery } = require('@google-cloud/bigquery');
  const bigquery = new BigQuery();
  const dataSetId = 'training_bqml';
  const dataset = bigquery.dataset(dataSetId);

  dataset.getModels().then(data => {
    const models = data[0];
    console.log('Models:');
    let resModels = [];
    models.forEach(model => {
      console.log(model.metadata);
      resModels.push(model.metadata);
    });
    res.json({ models: resModels });
  });
});

router.get('/models/:modelId', async (req, res, next) => {
  const { BigQuery } = require('@google-cloud/bigquery');
  const bigquery = new BigQuery();
  const dataSetId = 'training_bqml';
  const dataset = bigquery.dataset(dataSetId);
  const [model] = await dataset.model(req.params.modelId).get();

  console.log('Model:');
  console.log(model.metadata.modelReference);
  res.json({
    model: model.metadata.modelReference,
    featureColumns: model.metadata.featureColumns
  });
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
