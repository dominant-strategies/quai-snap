import chai, { assert } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { mockSnapProvider } from '../testingResources/mockWallet';

chai.use(sinonChai);

describe('Accounts.js', function () {
  describe('it should pass', function () {
    it('should return 1 when the value is present', function () {
      assert.equal([1, 2, 3].indexOf(2), 1);
    });
  });
});
