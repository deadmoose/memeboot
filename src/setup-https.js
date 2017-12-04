// @flow
import express from 'express';
import fs from 'fs';
import http from 'http';
import https from 'https';

function setupHttps(app: express) {
  const key = fs.readFileSync('encryption/private.key');
  const cert = fs.readFileSync('encryption/primary.crt');
  const ca = fs.readFileSync('encryption/intermediate.crt');
  const options = { key, cert, ca };
  https.createServer(options, app).listen(443);
  http.createServer(app).listen(80);
  // Redirect http to https.
  app.use(function(req, res, next) {
    if (req.secure) {
      next();
    } else {
      res.redirect('https://' + req.headers.host + req.url);
    }
  });
}

export default setupHttps;