import * as chai from 'chai';
import * as chaiPromis from 'chai-as-promised';
import * as spies from 'chai-spies';
import { APIClient } from '../../dist/request';
import { APICallError, APICallOptions } from '../../dist/types';
import { startHTTPServer } from './simple-http-server';

chai.use(spies);
chai.use(chaiPromis);
chai.should();

describe('testing APIClient', function() {
  describe.skip('#call() with wrong options', function() {
    let env = process.env;
    process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
    let server;
    before('starting test HTTP server', async function() {
      // console.log('Starting test server');
      server = await startHTTPServer(8443);
      return;
    });
    it.skip('with missing params should throw', async function() {
      const client = new APIClient('https://localhost:8443');
      const opts: any = {
        retries: 3,
        retryAfter: 2000
      };
      const spy = chai.spy.on(client, 'call');
      return client.call(opts).should.eventually.be.rejected;
    });
    it.skip('with missing options should throw', async function() {
      const client = new APIClient('https://localhost:8443');
      const opts: any = {};
      const spy = chai.spy.on(client, 'call');
      return client.call(opts).should.eventually.be.rejected;
    });
    it.skip('with undefined options should throw', async function() {
      const client = new APIClient('https://localhost:8443');
      const opts: any = undefined;
      const spy = chai.spy.on(client, 'call');
      return client.call(opts).should.eventually.be.rejected;
    });

    after('stopping HTTP server', async function() {
      // console.log('Stopping test server');
      server.close();
      process.env = env;
      return;
    });
  });
  describe('#call()', function() {
    let env = process.env;
    process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
    let server;
    before('starting test HTTP server', async function() {
      // console.log('Starting test server');
      server = await startHTTPServer(8443);
      return;
    });
    it('for 401 should retry 3 times (4 calls)', async function() {
      const client = new APIClient('https://localhost:8443');
      const opts: APICallOptions = {
        method: 'get',
        path: '/api/auth-required',
        json: true,
        retries: 3,
        retryAfter: 2000
      };
      const spy = chai.spy.on(client, 'call');
      await client.call(opts).should.eventually.be.rejected;
      return spy.should.have.been.called.exactly(4);
    });
    it('for a 401 in doNotTryOnErrors list, it should not retry (1 call)', async function() {
      const client = new APIClient('https://localhost:8443');
      const opts: APICallOptions = {
        method: 'get',
        path: '/api/auth-required',
        json: true,
        retries: 3,
        retryAfter: 2000,
        doNotRetryOnErrors: [401]
      };
      const spy = chai.spy.on(client, 'call');
      await client.call(opts).should.eventually.be.rejected;
      return spy.should.have.been.called.exactly(1);
    });
    it('should use headers option, if set (1 call)', async function() {
      const client = new APIClient('https://localhost:8443');
      const opts: APICallOptions = {
        method: 'get',
        path: '/api/get-test',
        headers: { 'x-test': 'testme', a: '123' },
        json: true,
        retries: 3,
        retryAfter: 2000
      };
      const spy = chai.spy.on(client, 'call');
      const result = await client.call(opts);
      result.should.have.property('result');
      result.headers['x-test'].should.equal('testme');
      result.headers['a'].should.equal('123');
      spy.should.have.been.called.once;
      return;
    });
    it('with a GET should use headers option preserving all headers, if set (1 call)', async function() {
      const client = new APIClient('https://localhost:8443');
      const opts: APICallOptions = {
        method: 'get',
        path: '/api/get-headers',
        json: true,
        authOptions: {
          authorizationType: 'Bearer',
          token: 'mytoken'
        },
        headers: { 'x-test': 'testme', a: '123', 'content-type': 'application/json' },
        retries: 3,
        retryAfter: 2000
      };
      const spy = chai.spy.on(client, 'call');
      const result = await client.call(opts);
      //console.log(result);
      result.should.have.property('result');
      result.headers['x-test'].should.equal('testme');
      result.headers['a'].should.equal('123');
      result.headers['authorization'].should.equal('Bearer mytoken');
      spy.should.have.been.called.once;
      return;
    });
    it('with a POST should use headers option preserving all headers, if set (1 call)', async function() {
      const body = { a: 'start', b: { b1: 'ok', b2: 'message' } };
      const sbody = JSON.stringify(body);
      const hash = 'FFFFFFFF123456';
      const client = new APIClient('https://localhost:8443');
      const opts: APICallOptions = {
        method: 'post',
        path: '/api/post-headers',
        authOptions: {
          authorizationType: 'Bearer',
          token: 'mytoken'
        },
        json: true,
        body: body,
        headers: { 'x-hmac': hash, 'x-test': 'testme', a: '123', 'content-type': 'application/json' },
        retries: 3,
        retryAfter: 2000
      };
      const spy = chai.spy.on(client, 'call');
      const result = await client.call(opts);
      //console.log('RESULT', result);
      result.should.have.property('result');
      result.headers['x-test'].should.equal('testme');
      result.headers['a'].should.equal('123');
      result.headers['x-hmac'].should.equal(hash);
      result.headers['authorization'].should.equal('Bearer mytoken');
      //console.log('RESULT.body--->', result.body);
      result.body.should.deep.equal(body);
      spy.should.have.been.called.once;
      return;
    });
    it('with a POST passing a JSON string should use headers option preserving all headers, if set (1 call)', async function() {
      const body = { a: 'start', b: { b1: 'ok', b2: 'message' } };
      const sbody = JSON.stringify(body);
      const hash = 'FFFFFFFF123456';
      const client = new APIClient('https://localhost:8443');
      const opts: APICallOptions = {
        method: 'post',
        path: '/api/post-string-headers',
        authOptions: {
          authorizationType: 'Bearer',
          token: 'mytoken'
        },
        body: sbody,
        headers: { 'content-length': Buffer.byteLength(sbody, 'utf8'), 'x-hmac': hash, 'x-test': 'testme', a: '123', 'content-type': 'application/json' },
        retries: 3,
        retryAfter: 2000
      };
      const spy = chai.spy.on(client, 'call');
      const result = await client.call(opts);
      //console.log('RESULT', result);
      const resBody = JSON.parse(result);
      //console.log('PARSED BODY', resBody);
      resBody.should.have.property('result');
      resBody.headers['x-test'].should.equal('testme');
      resBody.headers['a'].should.equal('123');
      resBody.headers['x-hmac'].should.equal(hash);
      resBody.headers['authorization'].should.equal('Bearer mytoken');
      //console.log('RESULT.body--->', result.body);
      resBody.body.should.deep.equal(body);
      spy.should.have.been.called.once;
      return;
    });
    it('for 200 OK should not retry (1 call)', async function() {
      const client = new APIClient('https://localhost:8443');
      const opts: APICallOptions = {
        method: 'get',
        path: '/api/get-test',
        json: true,
        retries: 3,
        retryAfter: 2000
      };
      const spy = chai.spy.on(client, 'call');
      const result = await client.call(opts);
      result.should.have.property('result');
      spy.should.have.been.called.once;
      return;
    });
    it('for 401 should retry for 3 times (4 calls)', async function() {
      const client = new APIClient('https://localhost:8443');
      const opts: APICallOptions = {
        method: 'get',
        path: '/api/auth-required',
        json: true,
        retries: 3,
        retryAfter: 2000
      };
      const spy = chai.spy.on(client, 'call');
      await client.call(opts).should.eventually.be.rejected;
      return spy.should.have.been.called.exactly(4);
    });
    it('for a 401 in doNotTryOnErrors list, it should not retry (1 call)', async function() {
      const client = new APIClient('https://localhost:8443');
      const opts: APICallOptions = {
        method: 'get',
        path: '/api/auth-required',
        json: true,
        retries: 3,
        retryAfter: 2000,
        doNotRetryOnErrors: [401]
      };
      const spy = chai.spy.on(client, 'call');
      await client.call(opts).should.eventually.be.rejected;
      return spy.should.have.been.called.exactly(1);
    });
    after('stopping HTTP server', async function() {
      // console.log('Stopping test server');
      server.close();
      process.env = env;
      return;
    });
  });
  describe('#call() with authentication', function() {
    let env = process.env;
    process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
    let server;
    before('starting test HTTP server', async function() {
      // console.log('Starting test server');
      server = await startHTTPServer(8443);
      return;
    });
    it('for a request with username password auth, it should be ok', async function() {
      const client = new APIClient('https://localhost:8443');
      const user = 'antonio';
      const password = '123456';
      const opts: APICallOptions = {
        method: 'get',
        path: '/api/usr-pass-auth',
        json: true,
        authOptions: { user, password },
        retries: 3,
        retryAfter: 2000
      };
      const spy = chai.spy.on(client, 'call');
      const result = await client.call(opts);
      result.should.have.property('headers');
      result.headers.authorization.should.equal(`Basic ${Buffer.from(`${user}:${password}`).toString('base64')}`);
      spy.should.have.been.called.once;
      return;
    });
    it('for a request with bearer token shoud return the correct header', async function() {
      const client = new APIClient('https://localhost:8443');
      const authorizationType = 'Bearer';
      const token = '123456';
      const opts: APICallOptions = {
        method: 'get',
        path: '/api/bearer-auth',
        json: true,
        authOptions: { authorizationType, token },
        retries: 3,
        retryAfter: 2000
      };
      const spy = chai.spy.on(client, 'call');
      const result = await client.call(opts);
      result.should.have.property('headers');
      //console.log(result.headers);
      result.headers.authorization.should.equal(`Bearer ${token}`);
      spy.should.have.been.called.once;
      return;
    });
    it('for a POST request with bearer token shoud return the correct header and body', async function() {
      const client = new APIClient('https://localhost:8443');
      const authorizationType = 'Bearer';
      const token = '123456';
      const body = { a: 1, b: 2 };
      const opts: APICallOptions = {
        method: 'post',
        path: '/api/bearer-auth',
        body,
        authOptions: { authorizationType, token },
        json: true,
        retries: 3,
        retryAfter: 2000
      };
      const spy = chai.spy.on(client, 'call');
      const result = await client.call(opts);
      result.should.have.property('headers');
      //console.log(result);
      result.headers.authorization.should.equal(`Bearer ${token}`);
      result.body.should.deep.equal(body);
      spy.should.have.been.called.once;
      return;
    });
    after('stopping HTTP server', async function() {
      // console.log('Stopping test server');
      server.close();
      process.env = env;
      return;
    });
  });
  describe('#call() for non-JSON response bodies', function() {
    let env = process.env;
    process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
    let server;
    before('starting test HTTP server', async function() {
      // console.log('Starting test server');
      server = await startHTTPServer(8443);
      return;
    });
    it('for HTML content, body should be a string', async function() {
      const client = new APIClient('https://localhost:8443');
      const opts: APICallOptions = {
        method: 'get',
        path: '/api/html',
        retries: 3,
        retryAfter: 2000
      };
      const spy = chai.spy.on(client, 'call');
      const result = await client.call(opts);
      result.should.be.equal(`<html><head><script></script></head><body></body></html>`);
      spy.should.have.been.called.once;
    });

    after('stopping HTTP server', async function() {
      // console.log('Stopping test server');
      server.close();
      process.env = env;
      return;
    });
  });
  describe('#call() with full response', function() {
    let env = process.env;
    process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
    let server;
    before('starting test HTTP server', async function() {
      // console.log('Starting test server');
      server = await startHTTPServer(8443);
      return;
    });
    it('with options.getFullresponse = true should return a full HTTP response', async function() {
      const client = new APIClient('https://localhost:8443');
      const opts: APICallOptions = {
        method: 'get',
        path: '/api/get-test',
        json: true,
        retries: 3,
        retryAfter: 2000,
        getFullResponse: true
      };
      const spy = chai.spy.on(client, 'call');
      const result = await client.call(opts);
      //console.dir(result, { colors: true, depth: 20 });
      result.should.have.property('body');
      result.should.have.property('readable');
      result.should.have.property('socket');
      spy.should.have.been.called.once;
    });
    it('without options.getFullresponse should return a body only HTTP response', async function() {
      const client = new APIClient('https://localhost:8443');
      const opts: APICallOptions = {
        method: 'get',
        path: '/api/get-test',
        json: true,
        retries: 3,
        retryAfter: 2000
      };
      const spy = chai.spy.on(client, 'call');
      const result = await client.call(opts);
      result.result.should.equal('ok');
      spy.should.have.been.called.once;
    });

    after('stopping HTTP server', async function() {
      // console.log('Stopping test server');
      server.close();
      process.env = env;
      return;
    });
  });
  describe('#call() with errors', function() {
    let env = process.env;
    process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
    let server;
    before('starting test HTTP server', async function() {
      // console.log('Starting test server');
      server = await startHTTPServer(8443);
      return;
    });
    it('with a call error should be rejected', async function() {
      const client = new APIClient('https://localhost:8443');
      const opts: APICallOptions = {
        method: 'get',
        path: '/api/get-error',
        json: true,
        retries: 1,
        retryAfter: 2000,
        getFullResponse: true
      };
      const spy = chai.spy.on(client, 'call');
      return client.call(opts).should.eventually.be.rejectedWith(APICallError);
    });

    after('stopping HTTP server', async function() {
      // console.log('Stopping test server');
      server.close();
      process.env = env;
      return;
    });
  });
  describe('#call() with timeout', function() {
    let env = process.env;
    process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
    let server;
    before('starting test HTTP server', async function() {
      // console.log('Starting test server');
      server = await startHTTPServer(8443);
      return;
    });
    it('with a timeout', async function() {
      const client = new APIClient('https://localhost:8443');
      const opts: APICallOptions = {
        method: 'get',
        path: '/api/too-long-request',
        json: true,
        timeout: 2000,
        retries: 1,
        retryAfter: 2000,
        getFullResponse: true
      };
      const spy = chai.spy.on(client, 'call');
      return client.call(opts).should.eventually.be.rejectedWith(APICallError);
    });

    after('stopping HTTP server', async function() {
      // console.log('Stopping test server');
      server.close();
      process.env = env;
      return;
    });
  });
});
