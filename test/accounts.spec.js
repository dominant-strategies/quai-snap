import chai, { assert, expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import MockWallet from '../testingResources/mockWallet';
import { mockAccountsObj } from '../testingResources/testConstantsAndHelpers';
import Accounts from '../src/accounts';

chai.use(sinonChai);
const sandbox = sinon.createSandbox();

describe('Accounts.js', function () {
  const mockWallet = new MockWallet();

  afterEach(function () {
    mockWallet.reset();
    sandbox.restore();
  });

  it('should initialize', function () {
    let mockAccounts = new Accounts(mockWallet, {}, null, null, false);

    assert.equal(mockAccounts.wallet, mockWallet);
    expect(mockAccounts.accounts).to.be.empty;
    assert.equal(mockAccounts.currentAccountId, null);
  });

  it('should load no accounts from the wallet when there are no stored accounts', async function () {
    mockWallet.rpcStubs.snap_manageState.withArgs('get').resolves({
      accounts: {},
      currentAccountId: null,
    });

    let mockAccountsClass = new Accounts(mockWallet, {}, null, null, false);
    mockAccountsClass.load();
    expect(mockAccountsClass.accounts).to.be.empty;
    expect(mockAccountsClass.currentAccountId).to.be.null;
  });

  // it('should load accounts from wallet when there are stored accounts', async function () {
  //   mockWallet.rpcStubs.snap_manageState.withArgs('get').resolves({
  //     Accounts: mockAccountsObj,
  //     currentAccountId: Object.values(mockAccountsObj)[0].addr,
  //   });
  //   let mockAccountsClass = new Accounts(
  //     mockWallet,
  //     mockAccountsObj,
  //     Object.values(mockAccountsObj)[0].addr,
  //     Object.values(mockAccountsObj)[0],
  //     true,
  //   );
  //   mockAccountsClass.load();
  //   console.log('HELLOOOO: ', mockAccountsClass.Accounts);
  //   expect(mockAccountsClass.accounts).to.deep.equal(mockAccountsObj);
  // });
});