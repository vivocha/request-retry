import * as chai from 'chai';
import * as chaiPromised from 'chai-as-promised';
import * as spies from 'chai-spies';
import { APIClient } from '../../dist/request';
import { APICallError, APICallOptions } from '../../dist/types';
import { startHTTPServer } from './simple-http-server';

chai.use(spies);
chai.use(chaiPromised);
chai.should();

describe('Testing APIClient STATIC methods', function() {
  afterEach(function() {
    chai.spy.restore();
  });
  describe('APIClient.get()', function() {
    let env = process.env;
    process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
    let server;
    before('starting test HTTP server', async function() {
      server = await startHTTPServer(8443);
      return;
    });
    it('for 200 OK should not retry (1 call)', async function() {
      const opts: APICallOptions = {
        json: true,
        retries: 3,
        retryAfter: 2000
      };
      const spy = chai.spy.on(APIClient.prototype, 'call');
      const result = await APIClient.get('https://localhost:8443/api/get-test', opts);
      result.should.have.property('result');
      spy.should.have.been.called.once;
      return;
    });
    it('for not listed error (401) should retry for 3 times (4 calls)', async function() {
      const opts: APICallOptions = {
        json: true,
        retries: 3,
        retryAfter: 2000
      };
      const spy = chai.spy.on(APIClient.prototype, 'call');
      await APIClient.get('https://localhost:8443/api/auth-required', opts).should.eventually.be.rejected;
      return spy.should.have.been.called.exactly(4);
    });
    it('for an error (401) in doNotTryOnErrors list, it should not retry (1 call)', async function() {
      const opts: APICallOptions = {
        retries: 3,
        retryAfter: 2000,
        json: true,
        doNotRetryOnErrors: [401]
      };
      const spy = chai.spy.on(APIClient.prototype, 'call');
      await APIClient.get('https://localhost:8443/api/auth-required', opts).should.eventually.be.rejected;
      return spy.should.have.been.called.exactly(1);
    });
    it('for an error (401) in doNotTryOnErrors list, it should not retry (1 call)', async function() {
      const opts: APICallOptions = {
        retries: 3,
        retryAfter: 2000,
        json: true,
        doNotRetryOnErrors: ['401']
      };
      const spy = chai.spy.on(APIClient.prototype, 'call');
      await APIClient.get('https://localhost:8443/api/auth-required', opts).should.eventually.be.rejected;
      return spy.should.have.been.called.exactly(1);
    });
    it('for an error (40x) in doNotTryOnErrors list, it should not retry (1 call)', async function() {
      const opts: APICallOptions = {
        retries: 3,
        retryAfter: 2000,
        json: true,
        doNotRetryOnErrors: ['40x']
      };
      const spy = chai.spy.on(APIClient.prototype, 'call');
      await APIClient.get('https://localhost:8443/api/auth-required', opts).should.eventually.be.rejected;
      return spy.should.have.been.called.exactly(1);
    });
    it('for an error (4xx) in doNotTryOnErrors list, it should not retry (1 call)', async function() {
      const opts: APICallOptions = {
        retries: 3,
        retryAfter: 2000,
        json: true,
        doNotRetryOnErrors: ['4xx']
      };
      const spy = chai.spy.on(APIClient.prototype, 'call');
      await APIClient.get('https://localhost:8443/api/auth-required', opts).should.eventually.be.rejected;
      return spy.should.have.been.called.exactly(1);
    });
    it('should use headers options, if set (1 call)', async function() {
      const opts: APICallOptions = {
        headers: { 'x-test': 'testme', a: '123', 'content-type': 'application/json' },
        json: true,
        retries: 3,
        retryAfter: 2000
      };
      const spy = chai.spy.on(APIClient.prototype, 'call');
      const result = await APIClient.get('https://localhost:8443/api/get-test', opts);
      result.should.have.property('result');
      result.headers['x-test'].should.equal('testme');
      result.headers['a'].should.equal('123');
      spy.should.have.been.called.once;
      return;
    });
    it('with Basic Auth should set the correct headers (1 call)', async function() {
      const opts: APICallOptions = {
        headers: { 'x-test': 'testme', a: '123', 'content-type': 'application/json' },
        json: true,
        retries: 3,
        retryAfter: 2000,
        authOptions: {
          user: 'usertest',
          password: 'passwordtest'
        }
      };
      const spy = chai.spy.on(APIClient.prototype, 'call');
      const result = await APIClient.get('https://localhost:8443/api/get-test', opts);
      result.should.have.property('result');
      result.headers['x-test'].should.equal('testme');
      result.headers['a'].should.equal('123');
      result.headers['authorization'].should.include('Basic');
      spy.should.have.been.called.once;
      return;
    });
    it('with Bearer Auth should set the correct headers (1 call)', async function() {
      const opts: APICallOptions = {
        headers: { 'x-test': 'testme', a: '123', 'content-type': 'application/json' },
        json: true,
        retries: 3,
        retryAfter: 2000,
        authOptions: {
          authorizationType: 'Bearer',
          token: '123456'
        }
      };
      const spy = chai.spy.on(APIClient.prototype, 'call');
      const result = await APIClient.get('https://localhost:8443/api/get-test', opts);
      result.should.have.property('result');
      result.headers['x-test'].should.equal('testme');
      result.headers['a'].should.equal('123');
      result.headers['authorization'].should.equal('Bearer 123456');
      spy.should.have.been.called.once;
      return;
    });
    it('with bearer (lowercase) Auth should set the correct headers (1 call) and use Bearer', async function() {
      const opts: APICallOptions = {
        headers: { 'x-test': 'testme', a: '123', 'content-type': 'application/json' },
        json: true,
        retries: 3,
        retryAfter: 2000,
        authOptions: {
          authorizationType: 'bearer',
          token: '123456'
        }
      };
      const spy = chai.spy.on(APIClient.prototype, 'call');
      const result = await APIClient.get('https://localhost:8443/api/get-test', opts);
      result.should.have.property('result');
      result.headers['x-test'].should.equal('testme');
      result.headers['a'].should.equal('123');
      result.headers['authorization'].should.equal('Bearer 123456');
      spy.should.have.been.called.once;
      return;
    });
    it('with custom (App) Auth should set the correct headers (1 call)', async function() {
      const opts: APICallOptions = {
        headers: { 'x-test': 'testme', a: '123', 'content-type': 'application/json' },
        json: true,
        retries: 3,
        retryAfter: 2000,
        authOptions: {
          authorizationType: 'App',
          token: '123456'
        }
      };
      const spy = chai.spy.on(APIClient.prototype, 'call');
      const result = await APIClient.get('https://localhost:8443/api/get-test', opts);
      result.should.have.property('result');
      result.headers['x-test'].should.equal('testme');
      result.headers['a'].should.equal('123');
      result.headers['authorization'].should.equal('App 123456');
      spy.should.have.been.called.once;
      return;
    });
    it('with custom (app. lowercase) Auth should set the correct headers (1 call) and preserve lowercase', async function() {
      const opts: APICallOptions = {
        headers: { 'x-test': 'testme', a: '123', 'content-type': 'application/json' },
        json: true,
        retries: 3,
        retryAfter: 2000,
        authOptions: {
          authorizationType: 'App',
          token: '123456'
        }
      };
      const spy = chai.spy.on(APIClient.prototype, 'call');
      const result = await APIClient.get('https://localhost:8443/api/get-test', opts);
      result.should.have.property('result');
      result.headers['x-test'].should.equal('testme');
      result.headers['a'].should.equal('123');
      result.headers['authorization'].should.equal('App 123456');
      spy.should.have.been.called.once;
      return;
    });
    it('with no json property (1 call) should return a non json body', async function() {
      const opts: APICallOptions = {
        retries: 3,
        retryAfter: 2000
      };
      const spy = chai.spy.on(APIClient.prototype, 'call');
      const result = await APIClient.get('https://localhost:8443/api/html', opts);
      result.should.be.equal(`<html><head><script></script></head><body></body></html>`);
      spy.should.have.been.called.once;
      return;
    });
    it('with json: false property (1 call) should return a non json body', async function() {
      const opts: APICallOptions = {
        retries: 3,
        retryAfter: 2000,
        json: false
      };
      const spy = chai.spy.on(APIClient.prototype, 'call');
      const result = await APIClient.get('https://localhost:8443/api/html', opts);
      result.should.be.equal(`<html><head><script></script></head><body></body></html>`);
      spy.should.have.been.called.once;
      return;
    });
    it('with json: true property (1 call) should return a json body', async function() {
      const opts: APICallOptions = {
        retries: 3,
        retryAfter: 2000,
        json: true
      };
      const spy = chai.spy.on(APIClient.prototype, 'call');
      const result = await APIClient.get('https://localhost:8443/api/get-test', opts);
      result.should.have.property('result');
      spy.should.have.been.called.once;
      return;
    });
    it('with getFullResponse: true property (1 call) should return full response', async function() {
      const opts: APICallOptions = {
        retries: 3,
        retryAfter: 2000,
        getFullResponse: true
      };
      const spy = chai.spy.on(APIClient.prototype, 'call');
      const result = await APIClient.get('https://localhost:8443/api/get-test', opts);
      result.should.have.property('body');
      result.should.have.property('readable');
      result.should.have.property('socket');
      result.headers['content-type'].should.include('application/json');
      spy.should.have.been.called.once;
      return;
    });
    it('with getFullResponse: false property (1 call) should return body only response', async function() {
      const opts: APICallOptions = {
        retries: 3,
        retryAfter: 2000,
        getFullResponse: false,
        json: true
      };
      const spy = chai.spy.on(APIClient.prototype, 'call');
      const result = await APIClient.get('https://localhost:8443/api/get-test', opts);
      result.should.have.property('result');
      spy.should.have.been.called.once;
      return;
    });
    it('a GET with a timeout should be rejected', async function() {
      return APIClient.get('https://localhost:8443/api/too-long-request', {
        timeout: 2000,
        retries: 1,
        retryAfter: 2000
      }).should.eventually.be.rejectedWith(APICallError);
    });
    it('with query params should use them properly (1 call)', async function() {
      const opts: APICallOptions = {
        json: true,
        retries: 3,
        retryAfter: 2000
      };
      const spy = chai.spy.on(APIClient.prototype, 'call');
      const result = await APIClient.get('https://localhost:8443/api/query-params?a=10&b=hello', opts);
      result.query.should.deep.equal({ a: '10', b: 'hello' });
      spy.should.have.been.called.once;
      return;
    });
    it('with query params should use them properly (1 call)', async function() {
      const opts: APICallOptions = {
        json: true,
        retries: 3,
        retryAfter: 2000,
        qs: {
          a: 'yes',
          b: 10
        }
      };
      const spy = chai.spy.on(APIClient.prototype, 'call');
      const result = await APIClient.get('https://localhost:8443/api/query-params', opts);
      result.query.should.deep.equal({ a: 'yes', b: '10' });
      spy.should.have.been.called.once;
      return;
    });
    it('with no options should set 2 retries (3 calls) ', async function() {
      const spy = chai.spy.on(APIClient.prototype, 'call');
      await APIClient.get('https://localhost:8443/api/fourzerofour').should.eventually.be.rejected;
      return spy.should.have.been.called.exactly(3);
    });
    after('stopping HTTP server', async function() {
      server.close();
      process.env = env;
      return;
    });
  });
});
