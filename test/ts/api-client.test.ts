import * as chai from 'chai';
import * as chaiPromis from 'chai-as-promised';
import * as spies from 'chai-spies';
import { APICallOptions, APIClient } from '../../dist/request';
import { startHTTPServer } from './simple-http-server';

chai.use(spies);
chai.use(chaiPromis);
chai.should();

describe('testing APIClient', function() {
  describe('#call()', function() {
    let env = process.env;
    process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
    let server;
    before('starting test HTTP server', async function() {
      console.log('Starting test server');
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
    it('for 401 should retry', async function() {
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
    it('for a 401 in doNotTryOnErrors list, it should not retry', async function() {
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
      console.log('Stopping test server');
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
      console.log('Starting test server');
      server = await startHTTPServer(8443);
      return;
    });
    it('for 200 OK should not retry', async function() {
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
    it('for 401 should retry', async function() {
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
    it('for a 401 in doNotTryOnErrors list, it should not retry', async function() {
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
      console.log('Stopping test server');
      server.close();
      process.env = env;
      return;
    });
  });
  describe('#call() with user passwd authentication', function() {
    let env = process.env;
    process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
    let server;
    before('starting test HTTP server', async function() {
      console.log('Starting test server');
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
        httpOptions: { user, password },
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
        httpOptions: { authorizationType, token },
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
        httpOptions: { authorizationType, token },
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
      console.log('Stopping test server');
      server.close();
      process.env = env;
      return;
    });
  });
});
