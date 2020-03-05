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
  describe('APIClient.patch()', function() {
    let env = process.env;
    process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
    let server;
    before('starting test HTTP server', async function() {
      // console.log('Starting test server');
      server = await startHTTPServer(8443);
      return;
    });
    it('for 200 should not retry (1 call)', async function() {
      const body = { thingName: 'lamp', b: { b1: 'ok', b2: 'message' } };
      const spy = chai.spy.on(APIClient.prototype, 'call');
      const result = await APIClient.patch('https://localhost:8443/api/things', body, {
        json: true,
        retries: 3,
        retryAfter: 2000
      });
      spy.should.have.been.called.once;
      result.thingName.should.equal('lamp');
      result.id.should.equal('abcdef123456');
      return;
    });
    it('for not listed error (401) should retry 2 times (3 calls)', async function() {
      const body = { thingName: 'lamp', b: { b1: 'ok', b2: 'message' } };
      const spy = chai.spy.on(APIClient.prototype, 'call');
      await APIClient.patch('https://localhost:8443/api/things-auth', body, {
        json: true,
        retries: 2,
        retryAfter: 1000
      }).should.eventually.be.rejected;
      return spy.should.have.been.called.exactly(3);
    });
    it('for a listed error (401) should not retry (1 call)', async function() {
      const body = { thingName: 'lamp', b: { b1: 'ok', b2: 'message' } };
      const spy = chai.spy.on(APIClient.prototype, 'call');
      await APIClient.patch('https://localhost:8443/api/things-auth', body, {
        json: true,
        retries: 2,
        retryAfter: 1000,
        doNotRetryOnErrors: [401]
      }).should.eventually.be.rejected;
      return spy.should.have.been.called.exactly(1);
    });
    it('for a listed error (401) should not retry (1 call)', async function() {
      const body = { thingName: 'lamp', b: { b1: 'ok', b2: 'message' } };
      const spy = chai.spy.on(APIClient.prototype, 'call');
      await APIClient.patch('https://localhost:8443/api/things-auth', body, {
        json: true,
        retries: 2,
        retryAfter: 1000,
        doNotRetryOnErrors: ['401']
      }).should.eventually.be.rejected;
      return spy.should.have.been.called.exactly(1);
    });
    it('for a listed error (40x) should not retry (1 call)', async function() {
      const body = { thingName: 'lamp', b: { b1: 'ok', b2: 'message' } };
      const spy = chai.spy.on(APIClient.prototype, 'call');
      await APIClient.patch('https://localhost:8443/api/things-auth', body, {
        json: true,
        retries: 2,
        retryAfter: 1000,
        doNotRetryOnErrors: ['40x']
      }).should.eventually.be.rejected;
      return spy.should.have.been.called.exactly(1);
    });
    it('for a listed error (4xx) should not retry (1 call)', async function() {
      const body = { thingName: 'lamp', b: { b1: 'ok', b2: 'message' } };
      const spy = chai.spy.on(APIClient.prototype, 'call');
      await APIClient.patch('https://localhost:8443/api/things-auth', body, {
        json: true,
        retries: 2,
        retryAfter: 1000,
        doNotRetryOnErrors: ['4xx']
      }).should.eventually.be.rejected;
      return spy.should.have.been.called.exactly(1);
    });
    it('with a patch should use headers option preserving all headers, if set (1 call)', async function() {
      const body = { a: 'start', b: { b1: 'ok', b2: 'message' } };
      const hash = 'FFFFFFFF123456';
      const spy = chai.spy.on(APIClient.prototype, 'call');
      const result = await APIClient.patch('https://localhost:8443/api/patch-headers', body, {
        authOptions: {
          authorizationType: 'Bearer',
          token: 'mytoken'
        },
        json: true,
        headers: { 'x-hmac': hash, 'x-test': 'testme', a: '123', 'content-type': 'application/json' },
        retries: 3,
        retryAfter: 2000
      });

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
    it('with a patch passing a JSON string should use headers option preserving all headers, if set (1 call)', async function() {
      const body = { a: 'start', b: { b1: 'ok', b2: 'message' } };
      const sbody = JSON.stringify(body);
      const hash = 'FFFFFFFF123456';
      const spy = chai.spy.on(APIClient.prototype, 'call');
      const result = await APIClient.patch('https://localhost:8443/api/patch-string-headers', sbody, {
        authOptions: {
          authorizationType: 'Bearer',
          token: 'mytoken'
        },
        headers: { 'content-length': Buffer.byteLength(sbody, 'utf8'), 'x-hmac': hash, 'x-test': 'testme', a: '123', 'content-type': 'application/json' },
        retries: 3,
        retryAfter: 2000
      });
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
    it('for a patch request with Bearer token should return the correct header and body', async function() {
      const authorizationType = 'Bearer';
      const token = '123456';
      const body = { a: 1, b: 2 };
      const spy = chai.spy.on(APIClient.prototype, 'call');
      const result = await APIClient.patch('https://localhost:8443/api/bearer-auth', body, {
        authOptions: { authorizationType, token },
        json: true,
        retries: 3,
        retryAfter: 2000
      });
      result.should.have.property('headers');
      //console.log(result);
      result.headers.authorization.should.equal(`Bearer ${token}`);
      result.body.should.deep.equal(body);
      spy.should.have.been.called.once;
      return;
    });
    it('for a patch request with bearer token (lowercase) should return the correct Bearer header and body', async function() {
      const authorizationType = 'bearer';
      const token = '123456';
      const body = { a: 1, b: 2 };
      const spy = chai.spy.on(APIClient.prototype, 'call');
      const result = await APIClient.patch('https://localhost:8443/api/bearer-auth', body, {
        authOptions: { authorizationType, token },
        json: true,
        retries: 3,
        retryAfter: 2000
      });
      result.should.have.property('headers');
      //console.log(result);
      result.headers.authorization.should.equal(`Bearer ${token}`);
      result.body.should.deep.equal(body);
      spy.should.have.been.called.once;
      return;
    });
    it('for a patch request with Basic auth should return the correct header and body', async function() {
      const body = { a: 1, b: 2 };
      const spy = chai.spy.on(APIClient.prototype, 'call');
      const result = await APIClient.patch('https://localhost:8443/api/patch-basic', body, {
        authOptions: { user: 'username', password: 'password' },
        json: true,
        retries: 3,
        retryAfter: 2000
      });
      result.should.have.property('headers');
      //console.log(result);
      result.headers.authorization.should.include('Basic');
      result.body.should.deep.equal(body);
      spy.should.have.been.called.once;
      return;
    });
    it('for a patch request with custom auth should use the correct header and body', async function() {
      const authorizationType = 'App';
      const token = '123456';
      const body = { a: 1, b: 2 };
      const spy = chai.spy.on(APIClient.prototype, 'call');
      const result = await APIClient.patch('https://localhost:8443/api/bearer-auth', body, {
        authOptions: { authorizationType, token },
        json: true,
        retries: 3,
        retryAfter: 2000
      });
      result.should.have.property('headers');
      //console.log(result);
      result.headers.authorization.should.equal(`App ${token}`);
      result.body.should.deep.equal(body);
      spy.should.have.been.called.once;
      return;
    });
    it('for a patch request with custom auth (lowercase) should use the correct preserved header and body', async function() {
      const authorizationType = 'app';
      const token = '123456';
      const body = { a: 1, b: 2 };
      const spy = chai.spy.on(APIClient.prototype, 'call');
      const result = await APIClient.patch('https://localhost:8443/api/bearer-auth', body, {
        authOptions: { authorizationType, token },
        json: true,
        retries: 3,
        retryAfter: 2000
      });
      result.should.have.property('headers');
      //console.log(result);
      result.headers.authorization.should.equal(`app ${token}`);
      result.body.should.deep.equal(body);
      spy.should.have.been.called.once;
      return;
    });
    it('for 200 and getFullResponse: true, should not retry (1 call)', async function() {
      const body = { thingName: 'lamp', b: { b1: 'ok', b2: 'message' } };
      const spy = chai.spy.on(APIClient.prototype, 'call');
      const result = await APIClient.patch('https://localhost:8443/api/things', body, {
        json: true,
        getFullResponse: true,
        retries: 3,
        retryAfter: 2000
      });
      spy.should.have.been.called.once;
      result.should.have.property('body');
      result.should.have.property('readable');
      result.should.have.property('socket');
      result.headers['content-type'].should.include('application/json');
      result.body.thingName.should.equal('lamp');
      result.body.id.should.equal('abcdef123456');
      return;
    });
    it('for a not listed error (401) should retry (6 calls)', async function() {
      const body = { thingName: 'lamp', b: { b1: 'ok', b2: 'message' } };
      const spy = chai.spy.on(APIClient.prototype, 'call');
      await APIClient.patch('https://localhost:8443/api/things-auth', body, {
        json: true,
        retries: 5,
        retryAfter: 500
      }).should.eventually.be.rejected;
      return spy.should.have.been.called.exactly(6);
    });
    it('with a request timeout should be rejected', async function() {
      const body = { thingName: 'lamp', b: { b1: 'ok', b2: 'message' } };
      const spy = chai.spy.on(APIClient.prototype, 'call');
      return APIClient.patch('https://localhost:8443/api/too-long-request', body, {
        json: true,
        retries: 5,
        retryAfter: 500,
        timeout: 2000
      }).should.eventually.be.rejectedWith(APICallError);
    });
    it('with query params should use them properly (1 call)', async function() {
      const opts: APICallOptions = {
        json: true,
        retries: 3,
        retryAfter: 2000
      };
      const spy = chai.spy.on(APIClient.prototype, 'call');
      const result = await APIClient.patch('https://localhost:8443/api/query-params?a=10&b=hello', {}, opts);
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
      const result = await APIClient.patch('https://localhost:8443/api/query-params', {}, opts);
      result.query.should.deep.equal({ a: 'yes', b: '10' });
      spy.should.have.been.called.once;
      return;
    });
    it('with no options should set 2 retries (3 calls) ', async function() {
      const spy = chai.spy.on(APIClient.prototype, 'call');
      await APIClient.patch('https://localhost:8443/api/fourzerofour', '').should.eventually.be.rejected;
      return spy.should.have.been.called.exactly(3);
    });
    after('stopping HTTP server', async function() {
      // console.log('Stopping test server');
      server.close();
      process.env = env;
      return;
    });
  });
});
