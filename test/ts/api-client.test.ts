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
  describe('#call() with wrong options', function() {
    let env = process.env;
    process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
    let server;
    before('starting test HTTP server', async function() {
      // console.log('Starting test server');
      server = await startHTTPServer(8443);
      return;
    });
    it('with missing params should throw', async function() {
      const client = new APIClient('https://localhost:8443');
      const opts: any = {
        retries: 3,
        retryAfter: 2000
      };
      const spy = chai.spy.on(client, 'call');
      return client.call(opts).should.eventually.be.rejected;
    });
    it('with missing options should throw', async function() {
      const client = new APIClient('https://localhost:8443');
      const opts: any = {};
      const spy = chai.spy.on(client, 'call');
      return client.call(opts).should.eventually.be.rejected;
    });
    it('with undefined options should throw', async function() {
      const client = new APIClient('https://localhost:8443');
      const opts: any = undefined;
      const spy = chai.spy.on(client, 'call');
      return client.call(opts).should.eventually.be.rejected;
    });
    it('for 401 should retry 3 times (4 calls)', async function() {
      const client = new APIClient('https://localhost:8443');
      const opts: APICallOptions = {
        method: 'get',
        path: '/api/auth-required',
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
  describe('#call()', function() {
    let env = process.env;
    process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
    let server;
    before('starting test HTTP server', async function() {
      // console.log('Starting test server');
      server = await startHTTPServer(8443);
      return;
    });

    it('should use headers option, if set (1 call)', async function() {
      const client = new APIClient('https://localhost:8443');
      const opts: APICallOptions = {
        method: 'get',
        path: '/api/get-test',
        headers: { 'x-test': 'testme', a: '123' },
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

    it('for 200 OK should not retry (1 call)', async function() {
      const client = new APIClient('https://localhost:8443');
      const opts: APICallOptions = {
        method: 'get',
        path: '/api/get-test',
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
