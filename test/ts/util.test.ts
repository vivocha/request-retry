import * as chai from 'chai';
const should = chai.should();

describe('Testing util functions', function() {
  describe('isDoNotRetryCode()', function() {
    function isDoNotRetryCode(options: any, statusCode: number): boolean {
      if (!options.doNotRetryOnErrors.length) {
        return false;
      } else if (options.doNotRetryOnErrors.includes(statusCode) || options.doNotRetryOnErrors.includes(statusCode.toString())) {
        return true;
      } else {
        //check if there are string patterns
        const errorPatterns: string[] = options.doNotRetryOnErrors.filter(e => typeof e === 'string') as string[];
        let isDoNotRetryCode = false;
        for (let status of errorPatterns) {
          const codexx = /(?<code>\d)xx/;
          const codex = /(?<code>\d0)x/;
          const xxmatch = codexx.exec(status);
          const xmatch = codex.exec(status);
          if (xxmatch && xxmatch?.groups?.code === statusCode.toString().charAt(0)) {
            // like 5xx
            isDoNotRetryCode = true;
            break;
          } else if (xmatch && xmatch?.groups?.code && statusCode.toString().startsWith(xmatch.groups.code)) {
            // like 40x
            isDoNotRetryCode = true;
            break;
          }
        }
        return isDoNotRetryCode;
      }
    }
    it('for a 50x pattern and 501 status should return true', function() {
      isDoNotRetryCode({ doNotRetryOnErrors: [401, '50x'] }, 501).should.be.true;
    });
    it('for a 50x pattern and 510 status should return false', function() {
      isDoNotRetryCode({ doNotRetryOnErrors: [401, '50x'] }, 510).should.be.false;
    });
    it('for a 5xx pattern and 501 status should return true', function() {
      isDoNotRetryCode({ doNotRetryOnErrors: [401, '5xx'] }, 501).should.be.true;
    });
    it('for a 5xx pattern and 510 status should return true', function() {
      isDoNotRetryCode({ doNotRetryOnErrors: [401, '5xx'] }, 510).should.be.true;
    });
    it('for a 40x pattern and 401 status should return true', function() {
      isDoNotRetryCode({ doNotRetryOnErrors: [401, '40x'] }, 401).should.be.true;
    });
    it('for a 40x pattern and 410 status should return false', function() {
      isDoNotRetryCode({ doNotRetryOnErrors: [401, '40x'] }, 410).should.be.false;
    });
    it('for a 4xx pattern and 404 status should return false', function() {
      isDoNotRetryCode({ doNotRetryOnErrors: [401, '4xx'] }, 404).should.be.true;
    });
    it('for a 4xx pattern and 410 status should return true', function() {
      isDoNotRetryCode({ doNotRetryOnErrors: [401, '4xx'] }, 410).should.be.true;
    });
    // number, NO PATTERN
    it('for a 401 number and 401 status should return true', function() {
      isDoNotRetryCode({ doNotRetryOnErrors: [401] }, 401).should.be.true;
    });
    it('for a 404 number and 401 status should return false', function() {
      isDoNotRetryCode({ doNotRetryOnErrors: [401, 500] }, 404).should.be.false;
    });
    // numbers as Strings
    it('for a 401 string and 401 status should return true', function() {
      isDoNotRetryCode({ doNotRetryOnErrors: ['401'] }, 401).should.be.true;
    });
    it('for a 404 string and 401 status should return false', function() {
      isDoNotRetryCode({ doNotRetryOnErrors: ['401', '500'] }, 404).should.be.false;
    });
    // general mixed
    it('for an array of mixed values including a 401 status should return true', function() {
      isDoNotRetryCode({ doNotRetryOnErrors: [401, '500', 400, '501'] }, 401).should.be.true;
    });
    it('for an array of mixed values not including a 401 status should return false', function() {
      isDoNotRetryCode({ doNotRetryOnErrors: ['30x', '500', 400, '501'] }, 401).should.be.false;
    });
    it('for an array of mixed values including a 502 status should return true', function() {
      isDoNotRetryCode({ doNotRetryOnErrors: ['502', 500, 400, '501'] }, 502).should.be.true;
    });
  });
});
