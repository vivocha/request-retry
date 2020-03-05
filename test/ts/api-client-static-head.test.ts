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
  describe('APIClient.head()', function() {
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
        retryAfter: 2000,
        getFullResponse: true
      };
      const spy = chai.spy.on(APIClient.prototype, 'call');
      const result = await APIClient.head('https://localhost:8443/api/head-test', opts);
      result.headers.should.be.ok;
      return spy.should.have.been.called.once;
    });
    it('for not listed error (401) should retry for 3 times (4 calls)', async function() {
      const opts: APICallOptions = {
        json: true,
        retries: 3,
        retryAfter: 2000,
        getFullResponse: true
      };
      const spy = chai.spy.on(APIClient.prototype, 'call');
      await APIClient.head('https://localhost:8443/api/auth-required', opts).should.eventually.be.rejected;
      return spy.should.have.been.called.exactly(4);
    });
    it('for an error (401) in doNotTryOnErrors list, it should not retry (1 call)', async function() {
      const opts: APICallOptions = {
        retries: 3,
        retryAfter: 2000,
        getFullResponse: true,
        doNotRetryOnErrors: [401]
      };
      const spy = chai.spy.on(APIClient.prototype, 'call');
      await APIClient.head('https://localhost:8443/api/auth-required', opts).should.eventually.be.rejected;
      return spy.should.have.been.called.exactly(1);
    });
    it('for an error (401) in doNotTryOnErrors list, it should not retry (1 call)', async function() {
      const opts: APICallOptions = {
        retries: 3,
        retryAfter: 2000,
        getFullResponse: true,
        doNotRetryOnErrors: ['401']
      };
      const spy = chai.spy.on(APIClient.prototype, 'call');
      await APIClient.head('https://localhost:8443/api/auth-required', opts).should.eventually.be.rejected;
      return spy.should.have.been.called.exactly(1);
    });
    it('for an error (40x) in doNotTryOnErrors list, it should not retry (1 call)', async function() {
      const opts: APICallOptions = {
        retries: 3,
        retryAfter: 2000,
        getFullResponse: true,
        doNotRetryOnErrors: ['40x']
      };
      const spy = chai.spy.on(APIClient.prototype, 'call');
      await APIClient.head('https://localhost:8443/api/auth-required', opts).should.eventually.be.rejected;
      return spy.should.have.been.called.exactly(1);
    });
    it('for an error (4xx) in doNotTryOnErrors list, it should not retry (1 call)', async function() {
      const opts: APICallOptions = {
        retries: 3,
        retryAfter: 2000,
        getFullResponse: true,
        doNotRetryOnErrors: ['4xx']
      };
      const spy = chai.spy.on(APIClient.prototype, 'call');
      await APIClient.head('https://localhost:8443/api/auth-required', opts).should.eventually.be.rejected;
      return spy.should.have.been.called.exactly(1);
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
      const result = await APIClient.head('https://localhost:8443/api/head-test', opts);
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
      const result = await APIClient.head('https://localhost:8443/api/head-test', opts);
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
      const result = await APIClient.head('https://localhost:8443/api/head-test', opts);
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
      const result = await APIClient.head('https://localhost:8443/api/head-test', opts);
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
      const result = await APIClient.head('https://localhost:8443/api/head-test', opts);
      result.headers['x-test'].should.equal('testme');
      result.headers['a'].should.equal('123');
      result.headers['authorization'].should.equal('App 123456');
      spy.should.have.been.called.once;
      return;
    });

    it('a head with a timeout should be rejected', async function() {
      return APIClient.head('https://localhost:8443/api/too-long-request', {
        timeout: 2000,
        retries: 1,
        retryAfter: 2000
      }).should.eventually.be.rejectedWith(APICallError);
    });

    it('with no options should set 2 retries (3 calls) ', async function() {
      const spy = chai.spy.on(APIClient.prototype, 'call');
      await APIClient.head('https://localhost:8443/api/fourzerofour').should.eventually.be.rejected;
      return spy.should.have.been.called.exactly(3);
    });
    after('stopping HTTP server', async function() {
      server.close();
      process.env = env;
      return;
    });
  });
});
