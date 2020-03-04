import * as chai from 'chai';
import { APIClient } from '../../dist/request';
import { APICallError, APICallOptions } from '../../dist/types';
import { startHTTPServer } from './simple-http-server';
const should = chai.should();

describe('Testing APICallError class', function() {
  describe('instantiate', function() {
    it('with basic params should instantiate properly ', function() {
      const err = new APICallError('myerr', null, 404, 'a message');
      err.name.should.equal('myerr');
      err.status.should.equal(404);
      err.message.should.equal('a message');
    });
    it('with no name and other params should use default name', function() {
      const err = new APICallError(null, null, 404, 'a message');
      err.name.should.equal('APICallError');
      err.status.should.equal(404);
      err.message.should.equal('a message');
    });
    it('with no name and no message but data should use default name and data.message', function() {
      const err = new APICallError(null, { message: 'data message' }, 404, null);
      err.name.should.equal('APICallError');
      err.status.should.equal(404);
      err.message.should.equal('data message');
      err.data.should.deep.equal({ message: 'data message' });
    });
    it('with no name and no status and no message but data should use default name and data.status', function() {
      const err = new APICallError(null, { message: 'data message', status: 501 }, null, null);
      err.name.should.equal('APICallError');
      err.status.should.equal(501);
      err.message.should.equal('data message');
      err.data.should.deep.equal({ message: 'data message', status: 501 });
    });
  });
  // API call errors after retries
  // * Issue #3
  describe('Returned Errors', function() {
    let env = process.env;
    process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
    let server;
    before('starting test HTTP server', async function() {
      // console.log('Starting test server');
      server = await startHTTPServer(8443);
      return;
    });
    it('Issue #3, returned error by a retried API call should be the one returned by the last call retry', async function() {
      const client = new APIClient('https://localhost:8443');
      const opts: APICallOptions = {
        method: 'get',
        path: '/api/get-error',
        json: true,
        retries: 2,
        retryAfter: 500,
        getFullResponse: true
      };
      try {
        await client.call(opts);
      } catch (error) {
        // console.log('ERROR', error);
        error.name.should.equal('APICallError');
        error.status.should.equal(500);
        error.data.should.deep.equal({ status: 500, reason: 'server error' });
        return;
      }
    });
    it('Issue #3, returned 401 with no message should be the one returned by the last call retry', async function() {
      const client = new APIClient('https://localhost:8443');
      const opts: APICallOptions = {
        method: 'get',
        path: '/api/auth-required',
        json: true,
        retries: 2,
        retryAfter: 500,
        getFullResponse: true
      };
      try {
        await client.call(opts);
      } catch (error) {
        //console.log('ERROR', error);
        error.name.should.equal('APICallError');
        error.status.should.equal(401);
        should.not.exist(error.data);
        error.message.should.equal('Error calling the API endpoint');
        return;
      }
    });
    after('stopping HTTP server', async function() {
      // console.log('Stopping test server');
      server.close();
      process.env = env;
      return;
    });
  });
  describe('Returned Errors in case of connection err', function() {
    it('Issue #3, returned error by a retried API with ECONNECT Error should return an APICallError', async function() {
      const client = new APIClient('https://localhost:8443');
      const opts: APICallOptions = {
        method: 'get',
        path: '/api/get-error',
        json: true,
        retries: 2,
        retryAfter: 500,
        getFullResponse: true
      };
      try {
        await client.call(opts);
      } catch (error) {
        error.name.should.equal('RequestError');
        error.message.should.include('connect ECONNREFUSED');
        return;
      }
    });
  });
});
