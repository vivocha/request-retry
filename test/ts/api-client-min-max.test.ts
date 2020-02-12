import * as chai from 'chai';
import * as chaiPromised from 'chai-as-promised';
import * as spies from 'chai-spies';
import { hrtime } from 'process';
import { APIClient } from '../../dist/request';
import { APICallOptions } from '../../dist/types';
import { startHTTPServer } from './simple-http-server';

chai.use(spies);
chai.use(chaiPromised);
chai.should();

describe('testing APIClient with minRetryAfter and maxRetryAfter options', function() {
  afterEach(function() {
    chai.spy.restore();
  });
  describe('#call() with minRetryAfter and maxRetryAfter options', function() {
    let env = process.env;
    process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
    let server;
    before('starting test HTTP server', async function() {
      // console.log('Starting test server');
      server = await startHTTPServer(8443);
      return;
    });
    it('for a GET 401 with min=500, max=3000, retries=3 should do 4 calls', async function() {
      const client = new APIClient('https://localhost:8443/api/auth-required');
      const opts: APICallOptions = {
        json: true,
        retries: 3,
        minRetryAfter: 500,
        maxRetryAfter: 3000
      };
      const spy = chai.spy.on(client, 'call');
      await client.call(opts).should.eventually.be.rejected;
      return spy.should.have.been.called.exactly(4);
    });
    it('for a GET 401 with min=500, max=4000, retries=10 should do 11 calls', async function() {
      const client = new APIClient('https://localhost:8443/api/auth-required');
      const opts: APICallOptions = {
        json: true,
        retries: 10,
        minRetryAfter: 500,
        maxRetryAfter: 4000
      };
      const spy = chai.spy.on(client, 'call');
      await client.call(opts).should.eventually.be.rejected;
      return spy.should.have.been.called.exactly(11);
    });
    it('for a GET 401 with no retryAfter, no min, no max, retries=5 should retry using a minRetryAfter of 1sec  (6 calls)', async function() {
      const client = new APIClient('https://localhost:8443/api/auth-required');
      let opts: APICallOptions = {
        json: true,
        retries: 5
      };
      const spy = chai.spy.on(client, 'call');
      await client.call(opts).should.eventually.be.rejected;
      return spy.should.have.been.called.exactly(6);
    });
    it('for a GET 401 with retryAfter set to 500ms, no min, no max, retries=5 should retry using a constant retryAfter  (6 calls)', async function() {
      const client = new APIClient('https://localhost:8443/api/auth-required');
      let opts: APICallOptions = {
        json: true,
        retries: 5,
        retryAfter: 500
      };
      const spy = chai.spy.on(client, 'call');
      await client.call(opts).should.eventually.be.rejected;
      return spy.should.have.been.called.exactly(6);
    });
    it('for a GET 401 with min=500, max=30*60*1000, retries=3 should stop after 3 retries (4 calls)', async function() {
      const client = new APIClient('https://localhost:8443/api/auth-required');
      const opts: APICallOptions = {
        json: true,
        retries: 3,
        minRetryAfter: 500,
        maxRetryAfter: 30 * 60 * 1000
      };
      const spy = chai.spy.on(client, 'call');
      await client.call(opts).should.eventually.be.rejected;
      return spy.should.have.been.called.exactly(4);
    });
    it('for a POST 401 with min=500, max=3000, retries=3 should do 4 calls', async function() {
      const client = new APIClient('https://localhost:8443/api/api/things-auth');
      const opts: APICallOptions = {
        method: 'post',
        json: true,
        retries: 3,
        minRetryAfter: 500,
        maxRetryAfter: 3000
      };
      const spy = chai.spy.on(client, 'call');
      await client.call(opts).should.eventually.be.rejected;
      return spy.should.have.been.called.exactly(4);
    });
    it('for a POST 401 with no retryAfter, no min, no max, retries=5 should retry using a minRetryAfter of 1sec  (6 calls)', async function() {
      const client = new APIClient('https://localhost:8443/api/things-auth');
      let opts: APICallOptions = {
        method: 'post',
        json: true,
        retries: 5
      };
      const spy = chai.spy.on(client, 'call');
      const start = hrtime();
      await client.call(opts).should.eventually.be.rejected;
      const end = hrtime(start);
      const endSec = end[0];
      const endMillis = end[1] / 1000000;
      //console.log('exec time: %ds %dms', end[0], end[1] / 1000000);
      endSec.should.be.approximately(1 + 2 + 4 + 8 + 16, 1);
      return spy.should.have.been.called.exactly(6);
    });
    it('for a POST 401 with retryAfter set to 500ms, no min, no max, retries=5 should retry using a constant retryAfter  (6 calls)', async function() {
      const client = new APIClient('https://localhost:8443/api/things-auth');
      let opts: APICallOptions = {
        method: 'post',
        json: true,
        retries: 5,
        retryAfter: 500
      };
      const spy = chai.spy.on(client, 'call');
      const start = hrtime();
      await client.call(opts).should.eventually.be.rejected;
      const end = hrtime(start);
      const endSec = end[0];
      const endMillis = end[1] / 1000000;
      //console.log('exec time: %ds %dms', end[0], end[1] / 1000000);
      endSec.should.equal(2);
      endMillis.should.be.approximately(500, 100);
      return spy.should.have.been.called.exactly(6);
    });

    after('stopping HTTP server', async function() {
      // console.log('Stopping test server');
      server.close();
      process.env = env;
      return;
    });
  });
});
