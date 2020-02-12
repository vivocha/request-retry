import * as chai from 'chai';
import { computeRetryAfter } from '../../dist/request';
chai.should();

describe('Testing Util functions', function() {
  describe('computeRetryAfter() with no max', function() {
    it('with addShift set to false, it should return twice the current number', function() {
      computeRetryAfter(2000, false).should.equal(4000);
      computeRetryAfter(1500, false).should.equal(3000);
      computeRetryAfter(500, false).should.equal(1000);
    });
    it('with addShift set to true, it should return twice the current number plus a shift', function() {
      computeRetryAfter(2000, true).should.be.greaterThan(4000);
      computeRetryAfter(1500, true).should.be.greaterThan(3000);
      computeRetryAfter(500, true).should.be.greaterThan(1000);
    });
    it('with addShift not set default must be true, it should return twice the current number plus a shift', function() {
      computeRetryAfter(2000).should.be.greaterThan(4000);
      computeRetryAfter(1500).should.be.greaterThan(3000);
      computeRetryAfter(500).should.be.greaterThan(1000);
    });
  });
  describe('computeRetryAfter() with max', function() {
    it('with addShift set to false and current < max and computed < max, it should return twice the current number', function() {
      computeRetryAfter(2000, false, 5000).should.equal(4000);
      computeRetryAfter(1500, false, 3500).should.equal(3000);
      computeRetryAfter(500, false, 2000).should.equal(1000);
    });
    it('with addShift set to true and current < max and computed < max , it should return twice the current number plus a shift', function() {
      computeRetryAfter(2000, true, 5000).should.be.greaterThan(4000);
      computeRetryAfter(1500, true, 3500).should.be.greaterThan(3000);
      computeRetryAfter(500, true, 1500).should.be.greaterThan(1000);
    });
    it('with addShift set to false and current >=max, it should return max', function() {
      computeRetryAfter(2000, false, 2000).should.equal(2000);
      computeRetryAfter(2000, false, 1500).should.equal(1500);
      computeRetryAfter(500, false, 450).should.equal(450);
    });
    it('with addShift set to true and current >=max, it should return max', function() {
      computeRetryAfter(2000, true, 2000).should.equal(2000);
      computeRetryAfter(2000, true, 1500).should.equal(1500);
      computeRetryAfter(500, true, 450).should.equal(450);
    });
    it('with addShift set to false and current < max and computed > max, it should return max', function() {
      computeRetryAfter(1002, false, 2000).should.equal(2000);
      computeRetryAfter(1000, false, 1500).should.equal(1500);
      computeRetryAfter(501, false, 500).should.equal(500);
    });
    it('with addShift set to true and current < max and computed > max, it should return max', function() {
      computeRetryAfter(1000, true, 2000).should.equal(2000);
      computeRetryAfter(1000, true, 1500).should.equal(1500);
      computeRetryAfter(500, true, 500).should.equal(500);
    });
  });
});
