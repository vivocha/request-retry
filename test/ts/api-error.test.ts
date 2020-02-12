import * as chai from 'chai';
import { APICallError } from '../../dist/types';
chai.should();

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
});
