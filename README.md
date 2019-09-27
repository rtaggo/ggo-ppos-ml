# 1 - GGO PoS Machine Learning

![Build Status][ci-badge]

Ce repository contient le code source du PPoS Machine Learning. 

[ci-badge]: https://storage.googleapis.com/nodejs-getting-started-tests-badges/1-tests.svg

# Instructions

1.  Install [Node.js](https://nodejs.org/en/).
1.  Install [git](https://git-scm.com/).
1.  Create a [Google Cloud Platform project](https://console.cloud.google.com). (required only if deploy to Google Cloud Plateform)
1.  Install the [Google Cloud SDK](https://cloud.google.com/sdk/). (required only if deploy to Google Cloud Plateform)

1. After downloading the SDK, initialize it:

        gcloud init

1.  Clone the repository:

        git clone https://github.com/rtaggo/ggo-ppos-ml.git

1.  Change directory:

        cd ggo-ppos-ml

1.  Install dependencies:

        npm install

1.  Start the app:

        npm start

        or 

        npm run dev (auto restart the server using nodemon)


1.  View the app at [http://localhost:8080](http://localhost:8080).

1.  Stop the app by pressing `Ctrl+C`.

1.  Deploy the app to Google Cloud Plateform (requires GCP authentication):

        gcloud app deploy

1.  View the deployed app at [https://YOUR_PROJECT_ID.appspot.com](https://YOUR_PROJECT_ID.appspot.com).



# Notes

Authentication

        gcloud auth application-default login

List of projects

        gcloud projects list

Change current project:

        gcloud config set project my-project

Check current config:

        gcloud config list


