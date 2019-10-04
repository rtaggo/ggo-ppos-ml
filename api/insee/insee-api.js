'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const path = require(`path`);
const logging = require('../../lib/logging');

const router = express.Router();

// Automatically parse request body as JSON
router.use(bodyParser.json());

router.get('/', (req, res, next) => {
  res.json({ message: '[GET] /api/insee' });
});

router.post('/carreaux', async (req, res, next) => {
  const { BigQuery } = require('@google-cloud/bigquery');

  var geojsonResponse = {
    type: 'FeatureCollection',
    features: []
  };
  const bigquery = new BigQuery();
  let isoQuery = `SELECT
    ST_AsGeoJSON(geom) AS geom,
    idINSPIRE, 
    Ind,
    Men,
    Ind_snv revenus   
		FROM \`ggo-ppos-bqgis.insee.carreaux_2015\` 
		WHERE 
			ST_WITHIN(
        centroid,
        ST_GEOGFROMGEOJSON ('${JSON.stringify(req.body.geometry)}'))`;
  const options = {
    query: isoQuery,
    // Location must match that of the dataset(s) referenced in the query.
    location: 'EU'
  };

  // Runs the query as a job
  const [job] = await bigquery.createQueryJob(options);
  console.log(`Job ${job.id} started.`);

  // Waits for the query to finish
  const [rows] = await job.getQueryResults();
  rows.forEach(row => {
    const c_geom = row['geom'];
    const c_idINSPIRE = row['idINSPIRE'];
    geojsonResponse.features.push({
      type: 'Feature',
      properties: {
        idINSPIRE: c_idINSPIRE,
        bucket: req.body.properties.bucket,
        pop: row['Ind'],
        men: row['Men'],
        revenus: row['revenus'],
        revenus_moyen: row['revenus'] / row['Ind']
      },
      geometry: JSON.parse(c_geom)
    });
  });
  res.status(200).json(geojsonResponse);
});

router.post('/carreaux_old', async (req, res, next) => {
  const { BigQuery } = require('@google-cloud/bigquery');

  var geojsonResponse = {
    type: 'FeatureCollection',
    features: []
  };
  const bigquery = new BigQuery();
  let isoQuery = `SELECT
		ST_AsGeoJSON(c.geom) AS geom,
    c.idINSPIRE, c.id,
    ind_c,
		(r_men * ind_c)/r_ind_r men_c,
		(r_men_prop * ind_c)/r_ind_r men_prop_c,
		(r_ind_srf * ind_c)/r_ind_r revenus_c,
		(r_ind_age1 * ind_c)/r_ind_r age1_c,
		(r_ind_age2 * ind_c)/r_ind_r age2_c,
		(r_ind_age3 * ind_c)/r_ind_r age3_c,
		(r_ind_age4 * ind_c)/r_ind_r age4_c,
		(r_ind_age5 * ind_c)/r_ind_r age5_c,
		(r_ind_age6 * ind_c)/r_ind_r age6_c,
		(r_ind_age7 * ind_c)/r_ind_r age7_c,
		(r_ind_age8 * ind_c)/r_ind_r age8_c 
		FROM \`ggo-ppos-bqgis.insee.carreaux\` c 
		LEFT JOIN \`ggo-ppos-bqgis.insee.carreaux_indicateurs\` ci 
		ON c.idINSPIRE = ci.idINSPIRE
		WHERE 
			ST_WITHIN(
        c.centroid,
        ST_GEOGFROMGEOJSON ('${JSON.stringify(req.body.geometry)}'))`;
  const options = {
    query: isoQuery,
    // Location must match that of the dataset(s) referenced in the query.
    location: 'EU'
  };

  // Runs the query as a job
  const [job] = await bigquery.createQueryJob(options);
  console.log(`Job ${job.id} started.`);

  // Waits for the query to finish
  const [rows] = await job.getQueryResults();
  rows.forEach(row => {
    const c_geom = row['geom'];
    const c_id = row['id'];
    const c_idINSPIRE = row['idINSPIRE'];
    geojsonResponse.features.push({
      type: 'Feature',
      properties: {
        id: c_id,
        idINSPIRE: c_idINSPIRE,
        bucket: req.body.properties.bucket,
        pop: row['ind_c'],
        men: row['men_c'],
        men_prop: row['men_prop_c'],
        revenus: row['revenus_c'],
        pop_age1: row['age1_c'],
        pop_age2: row['age2_c'],
        pop_age3: row['age3_c'],
        pop_age4: row['age4_c'],
        pop_age5: row['age5_c'],
        pop_age6: row['age6_c'],
        pop_age7: row['age7_c'],
        pop_age8: row['age8_c']
      },
      geometry: JSON.parse(c_geom)
    });
  });
  res.status(200).json(geojsonResponse);
});

/**
 * Errors on "/insee/*" routes.
 */
router.use((err, req, res, next) => {
  // Format error and forward to generic error handler for logging and
  // responding to the request
  err.response = err.message;
  next(err);
});

module.exports = router;
