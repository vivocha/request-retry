import * as bodyParser from 'body-parser';
import * as express from 'express';
import * as https from 'https';
import * as multer from 'multer';
import * as pem from 'pem-promise';

export async function startHTTPServer(port: number = 443): Promise<any> {
  const keys = await pem.createCertificate({ days: 1, selfSigned: true });
  const app = express();
  //app.use(bodyParser.text());
  app.use(bodyParser.json());
  const upload = multer({ dest: 'uploads/' });

  // * Endpoints

  // * GET

  app.get('/api/get-test', (req, res) => {
    res.send({ result: 'ok', headers: req.headers });
  });
  app.get('/api/query-params', (req, res) => {
    res.send({ result: 'ok', query: req.query });
  });
  app.get('/api/get-headers', (req, res) => {
    res.send({ result: 'ok', headers: req.headers });
  });
  app.get('/api/auth-required', (req, res) => {
    res.status(401).end();
  });
  app.get('/api/gone', (req, res) => {
    res.status(410).end();
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
  app.get('/api/html', (req, res) => {
    res.setHeader('content-type', 'text/html');
    res.status(200).send(`<html><head><script></script></head><body></body></html>`);
  });
  app.get('/api/get-error', (req, res) => {
    res.status(500).send({ status: 500, reason: 'server error' });
  });
  app.get('/api/too-long-request', (req, res) => {
    setTimeout(() => res.status(200).send({ code: 'too long request' }), 10000);
  });

  // * POST

  app.post('/api/query-params', (req, res) => {
    res.send({ result: 'ok', query: req.query });
  });
  app.post('/api/bearer-auth', (req, res) => {
    res.status(200).send({
      headers: req.headers,
      body: req.body
    });
  });
  app.post('/api/post-basic', (req, res) => {
    res.status(201).send({
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
  app.post('/api/post-headers', (req, res) => {
    res.send({ result: 'ok', headers: req.headers, body: req.body });
  });
  app.post('/api/post-string-headers', (req, res) => {
    res.send({ result: 'ok', headers: req.headers, body: req.body });
  });
  app.post('/api/things', (req, res) => {
    res.status(201).send({ ...req.body, id: 'abcdef123456' });
  });
  app.post('/api/things-auth', (req, res) => {
    res.status(401).send({ error: 'auth required' });
  });
  app.post('/api/too-long-request', (req, res) => {
    setTimeout(() => res.status(201).send({ code: 'too long request' }), 10000);
  });

  // * PUT

  app.put('/api/query-params', (req, res) => {
    res.send({ result: 'ok', query: req.query });
  });
  app.put('/api/bearer-auth', (req, res) => {
    res.status(200).send({
      headers: req.headers,
      body: req.body
    });
  });
  app.put('/api/put-basic', (req, res) => {
    res.status(201).send({
      headers: req.headers,
      body: req.body
    });
  });
  app.put('/api/put-test', (req, res) => {
    res.status(200).send({ headers: req.headers, body: req.body });
  });
  app.put('/api/longreq', (req, res) => {
    setTimeout(() => res.status(200).send({ headers: req.headers, body: req.body }), 22 * 1000);
  });
  app.put('/api/json-res', (req, res) => {
    res.send(req.body);
  });
  app.put('/api/put-headers', (req, res) => {
    res.send({ result: 'ok', headers: req.headers, body: req.body });
  });
  app.put('/api/put-string-headers', (req, res) => {
    res.send({ result: 'ok', headers: req.headers, body: req.body });
  });
  app.put('/api/things', (req, res) => {
    res.status(200).send({ ...req.body, id: 'abcdef123456' });
  });
  app.put('/api/things-auth', (req, res) => {
    res.status(401).send({ error: 'auth required' });
  });
  app.put('/api/too-long-request', (req, res) => {
    setTimeout(() => res.status(200).send({ code: 'too long request' }), 10000);
  });

  // * DELETE

  app.delete('/api/query-params', (req, res) => {
    res.send({ result: 'ok', query: req.query });
  });
  app.delete('/api/bearer-auth/:id', (req, res) => {
    res.status(200).send({
      headers: req.headers,
      body: { id: req.params.id }
    });
  });
  app.delete('/api/delete-basic/:id', (req, res) => {
    res.status(200).send({
      headers: req.headers,
      body: { id: req.params.id }
    });
  });
  app.delete('/api/delete-test/:id', (req, res) => {
    res.status(200).send({ headers: req.headers, body: { id: req.params.id } });
  });
  app.delete('/api/longreq', (req, res) => {
    setTimeout(() => res.status(200).send({ headers: req.headers, body: req.body }), 22 * 1000);
  });
  app.delete('/api/delete-headers/:id', (req, res) => {
    res.send({ result: 'deleted', headers: req.headers, body: { id: req.params.id } });
  });
  app.delete('/api/delete-string-headers/:id', (req, res) => {
    res.send({ result: 'ok', headers: req.headers, body: { id: req.params.id } });
  });
  app.delete('/api/things/:id', (req, res) => {
    res.status(200).send({ id: req.params.id });
  });
  app.delete('/api/things-auth/:id', (req, res) => {
    res.status(401).send({ error: 'auth required' });
  });
  app.delete('/api/too-long-request', (req, res) => {
    setTimeout(() => res.status(200).send({ code: 'too long request' }), 10000);
  });

  // * PATCH

  app.patch('/api/query-params', (req, res) => {
    res.send({ result: 'ok', query: req.query });
  });
  app.patch('/api/bearer-auth', (req, res) => {
    res.status(200).send({
      headers: req.headers,
      body: req.body
    });
  });
  app.patch('/api/patch-basic', (req, res) => {
    res.status(201).send({
      headers: req.headers,
      body: req.body
    });
  });
  app.patch('/api/patch-test', (req, res) => {
    res.status(200).send({ headers: req.headers, body: req.body });
  });
  app.patch('/api/longreq', (req, res) => {
    setTimeout(() => res.status(200).send({ headers: req.headers, body: req.body }), 22 * 1000);
  });
  app.patch('/api/json-res', (req, res) => {
    res.send(req.body);
  });
  app.patch('/api/patch-headers', (req, res) => {
    res.send({ result: 'ok', headers: req.headers, body: req.body });
  });
  app.patch('/api/patch-string-headers', (req, res) => {
    res.send({ result: 'ok', headers: req.headers, body: req.body });
  });
  app.patch('/api/things', (req, res) => {
    res.status(200).send({ ...req.body, id: 'abcdef123456' });
  });
  app.patch('/api/things-auth', (req, res) => {
    res.status(401).send({ error: 'auth required' });
  });
  app.patch('/api/too-long-request', (req, res) => {
    setTimeout(() => res.status(200).send({ code: 'too long request' }), 10000);
  });

  // * HEAD

  app.head('/api/head-test', (req, res) => {
    res.set(req.headers);
    res.end();
    //res.writeHead(200, req.headers).end();
  });
  app.head('/api/auth-required', (req, res) => {
    res.set(req.headers);
    res.status(401);
    res.end();
  });
  app.head('/api/head-error', (req, res) => {
    //res.writeHead(500, { ...req.headers, 'x-error': 'test error' });
    res.set({ ...req.headers, 'x-error': 'test error' });
    res.status(500);
    res.end();
  });
  app.head('/api/too-long-request', (req, res) => {
    setTimeout(() => res.status(200).send({ code: 'too long request' }), 10000);
  });

  return new Promise((resolve, reject) => {
    resolve(https.createServer({ key: keys.serviceKey, cert: keys.certificate }, app).listen(port));
  });
}
