'use strict';

const express = require('express');
const bodyParser = require('body-parser');

const router = express.Router();

// Automatically parse request body as JSON
router.use(bodyParser.json());

router.get('/', (req, res, next) => {
  res.json({ message: '[GET] /api/ml' });
});

router.get('/models', async (req, res, next) => {
  const { BigQuery } = require('@google-cloud/bigquery');
  const bigquery = new BigQuery();
  const dataSetId = 'training_bqml';

  try {
    const dataset = bigquery.dataset(dataSetId);

    /*
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
    */
    const [models] = await dataset.getModels();
    console.log(JSON.stringify(models));
    let resModels = [];
    models.forEach(model => {
      console.log(model);
      resModels.push(model.metadata);
    });
    res.json({ models: resModels });
  } catch (err) {
    res.json(err);
  }
});

router.get('/models/:modelId', async (req, res, next) => {
  const { BigQuery } = require('@google-cloud/bigquery');
  const bigquery = new BigQuery();
  const dataSetId = 'training_bqml';
  const dataset = bigquery.dataset(dataSetId);
  const [model] = await dataset.model(req.params.modelId).get();

  //console.log(JSON.stringify(model));
  //console.log(model.metadata.modelReference);
  /*
  let modelRespBody = model.metadata.modelReference;
  modelRespBody.featureColumns = model.metadata.featureColumns;
  modelRespBody.labelColumns = model.metadata.labelColumns;
  res.json(modelRespBody);
  */
  /*
  res.json({
    model: model.metadata.modelReference,
    featureColumns: model.metadata.featureColumns
  });
  */
  res.json({
    modelReference: model.metadata.modelReference,
    featureColumns: model.metadata.featureColumns,
    labelColumns: model.metadata.labelColumns,
    description: model.metadata.description,
    modelType: model.metadata.modelType
  });
});

router.post('/models/:modelId/predict', async (req, res, next) => {
  const reqBody = req.body;
  let selectFeature = `(SELECT ${reqBody.featureColumns.map(fc => reqBody.featureValues[fc.name] + ' as ' + fc.name).join(', ')} )`;
  console.log(`selectFeature: ${selectFeature}`);
  let bqRequest = `SELECT * FROM ML.PREDICT(MODEL \`${reqBody.modelReference.projectId}.${reqBody.modelReference.datasetId}.${reqBody.modelReference.modelId}\`, ${selectFeature} )`;
  console.log(`bqRequest: ${bqRequest}`);

  const { BigQuery } = require('@google-cloud/bigquery');
  const bigquery = new BigQuery();

  const options = {
    query: bqRequest,
    // Location must match that of the dataset(s) referenced in the query.
    location: 'US'
  };

  // Runs the query as a job
  const [job] = await bigquery.createQueryJob(options);
  console.log(`Job ${job.id} started.`);

  // Waits for the query to finish
  const [rows] = await job.getQueryResults();
  console.log('rows: ', rows[0]);
  let r0 = rows[0];
  /*
  r0.predictedLabel = Object.keys(r0)
    .filter(k => k.indexOf('predicted_') === 0 && k.indexOf('_probs') < 0)[0]
    .replace('predicted_', '');
  */
  res.json({ model: req.body, predictions: rows });
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
