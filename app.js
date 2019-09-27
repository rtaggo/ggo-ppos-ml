// Copyright 2018, Google LLC.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';

// [START debug]
// Activate Google Cloud Trace and Debug when in production
if (process.env.NODE_ENV === 'production') {
  require('@google-cloud/trace-agent').start();
  require('@google-cloud/debug-agent').start();
}
// [END debug]

const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');

const config = require('./config');
const logging = require('./lib/logging');

const routesIndexes = require('./routes/index.router');

const app = express();

app.disable('etag');

// Add the request logger before anything else so that it can
// accurately log requests.
// [START requests]
app.use(logging.requestLogger);
// [END requests]

// [START hello_world]
// Say hello!
/*
app.get('/', (req, res) => {
  const options = {
    user: config.get('MYSQL_USER'),
    password: config.get('MYSQL_PASSWORD'),
    database: 'bookshelf',
  };
  console.log(`config: ${JSON.stringify(options)}`);
  res.status(200).send('Hello, world!');
});
*/
// [END hello_world]

// [START enable_parser]
app.use(bodyParser.urlencoded({ extended: true }));
// [END enable_parser]

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/views/index.html'));
  //res.status(200).send('Hello, world!');
});

app.use('/api', routesIndexes);

/*
app.options('/rest', cors());

app.get('/rest/alive', cors(), (req, res, next) => {
  res.header('Content-Type', 'application/json');
  res.json({ message: '[GET] /rest/alive' });
});
// GEOSERVICE
app.use('/rest/geoservice', require('./services/geoservice/api'));
*/
// Basic 404 handler
app.use((req, res) => {
  res.status(404).send('Not Found');
});

// Basic error handler
app.use((err, req, res) => {
  /* jshint unused:false */
  console.error(err);
  // If our routes specified a specific response, then send that. Otherwise,
  // send a generic message so as not to leak anything.
  res.status(500).send(err.response || 'Something broke!');
});

if (module === require.main) {
  // [START server]
  // Start the server
  const server = app.listen(process.env.PORT || 8080, () => {
    console.log(`Welcome to Galigeo REST API App`);
    const port = server.address().port;
    console.log(`App listening on port ${port}`);
  });
  // [END server]
}

module.exports = app;
