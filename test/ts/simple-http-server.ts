import * as bodyParser from 'body-parser';
import * as express from 'express';
import * as https from 'https';
import * as multer from 'multer';
import * as pem from 'pem-promise';

export async function startHTTPServer(port: number = 443): Promise<any> {
  const keys = await pem.createCertificate({ days: 1, selfSigned: true });
  const app = express();
  app.use(bodyParser.json());

  const upload = multer({ dest: 'uploads/' });
  app.get('/api/get-test', (req, res) => {
    res.send({ result: 'ok', headers: req.headers });
  });
  app.get('/api/auth-required', (req, res) => {
    res.status(401).end();
  });
  app.get('/api/usr-pass-auth', (req, res) => {
    res.status(200).send({
      headers: req.headers
    });
  });
  app.get('/api/bearer-auth', (req, res) => {
    res.status(200).send({
      headers: req.headers
    });
  });
  app.post('/api/bearer-auth', (req, res) => {
    res.status(200).send({
      headers: req.headers,
      body: req.body
    });
  });
  app.post('/api/post-test', (req, res) => {
    res.status(201).send({ headers: req.headers, body: req.body });
  });
  app.post('/api/longreq', (req, res) => {
    setTimeout(() => res.status(201).send({ headers: req.headers, body: req.body }), 22 * 1000);
  });
  app.post('/api/json-res', (req, res) => {
    res.send(req.body);
  });

  return new Promise((resolve, reject) => {
    resolve(https.createServer({ key: keys.serviceKey, cert: keys.certificate }, app).listen(port));
  });
}
