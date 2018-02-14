'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp(functions.config().firebase);

const co = require('co');
const _ = require('underscore');

const express = require('express');
const cookieParser = require('cookie-parser')();
const request = require('request-promise');
const cors = require('cors')({origin: true});
const app = express();
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

// Express middleware that validates Firebase ID Tokens passed in the Authorization HTTP header.
// The Firebase ID token needs to be passed as a Bearer token in the Authorization HTTP header like this:
// `Authorization: Bearer <Firebase ID Token>`.
// when decoded successfully, the ID Token content will be added as `req.user`.

app.use(cors);
app.use(cookieParser);

app.get('/shorten/:key', (req, res) => {
  console.log("snapshot: ", functions.config().firebase.apiKey);
  co(function *() {
    const snapshot = yield admin.database().ref('/links/' + req.params.key).once('value');
    const url = snapshot.val();
    console.log("url:", url);
    res.status(200).render('index.html', url);
  })
});

// Shorten URL
exports.shortenUrl = functions.database.ref('/links/{linkID}').onWrite((event) => {
  const snapshot = event.data;
  console.log("snapshot: ", snapshot.val(), functions.config().firebase.apiKey);
  if (typeof snapshot.val() !== 'string') {
    return null;
  }
  return createShortenerPromise(snapshot);
});

// URL to the Google URL Shortener API.
// google api console에서 shortner api 생성 및 활성화가 필요하다. 
// 참조: https://developers.google.com/url-shortener/v1/getting_started
function createShortenerRequest(sourceUrl) {
  return {
    method: 'POST',
    uri: `https://www.googleapis.com/urlshortener/v1/url?key=${functions.config().firebase.apiKey}`,
    body: {
      longUrl: sourceUrl,
    },
    json: true,
    resolveWithFullResponse: true,
  };
}

function createShortenerPromise(snapshot) {
  const key = snapshot.key;
  const originalUrl = snapshot.val();
  return request(createShortenerRequest(originalUrl)).then((response) => {
    if (response.statusCode === 200) {
      return response.body.id;
    }
    throw response.body;
  }).then((shortUrl) => {
    return admin.database().ref(`/links/${key}`).set({
      original: originalUrl,
      short: shortUrl,
    });
  });
}

exports.addLink = functions.https.onRequest((req, res) => {
  co(function *() {
    // Grab the text parameter.
    const url = req.body.url;
    // Push the new message into the Realtime Database using the Firebase Admin SDK.
    const result = yield admin.database().ref('/links').push(url);
    console.log("result:", result);
    res.status(201).json({key: result.key});
  });
});

exports.app = functions.https.onRequest(app);