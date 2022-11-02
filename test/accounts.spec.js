import chai, { assert, expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import MockWallet from '../testingResources/mockWallet';
import { mockAccountsArray } from '../testingResources/testConstantsAndHelpers';
import Accounts from '../src/accounts';

chai.use(sinonChai);
const sandbox = sinon.createSandbox();

describe('Accounts.js', function () {
  const mockWallet = new MockWallet();

  afterEach(function () {
    mockWallet.reset();
    sandbox.restore();
  });

  it('should initialize the Accounts class', function () {
    let mockAccounts = new Accounts(mockWallet, {}, null, null, false);

    assert.equal(mockAccounts.wallet, mockWallet);
    expect(mockAccounts.accounts).to.be.empty;
    assert.equal(mockAccounts.currentAccountId, null);
  });

  it('should load no accounts when there are no accounts in state', async function () {
    mockWallet.rpcStubs.snap_manageState.withArgs('get').resolves({});
    let mockAccountsClass = new Accounts(mockWallet, {}, null, null, false);

    await mockAccountsClass.load();
    expect(mockAccountsClass.loaded).to.be.true;
    expect(mockWallet.rpcStubs.snap_manageState).to.have.been.calledOnceWith(
      'get',
    );
    expect(mockAccountsClass.accounts).to.be.empty;
    expect(mockAccountsClass.currentAccountId).to.be.null;
  });

  it('should load all accounts when there are accounts in state', async function () {
    let mockStateWithAccounts = {
      currentAccountId: mockAccountsArray[0].addr,
      accounts: mockAccountsArray,
    };
    mockWallet.rpcStubs.snap_manageState
      .withArgs('get')
      .resolves(mockStateWithAccounts);
    let mockAccountsClass = new Accounts(
      mockWallet,
      mockAccountsArray,
      mockAccountsArray[0].addr,
      mockAccountsArray[0],
      false,
    );

    await mockAccountsClass.load();
    expect(mockAccountsClass.loaded).to.be.true;
    expect(mockWallet.rpcStubs.snap_manageState).to.have.been.calledOnceWith(
      'get',
    );
    expect(mockAccountsClass.accounts).to.deep.equal(mockAccountsArray);
  });

  it('should return the current account', async function () {
    let mockStateWithAccounts = {
      currentAccountId: mockAccountsArray[0].addr,
      accounts: mockAccountsArray,
    };
    mockWallet.rpcStubs.snap_manageState
      .withArgs('get')
      .resolves(mockStateWithAccounts);
    let mockAccountsClass = new Accounts(
      mockWallet,
      mockAccountsArray,
      mockAccountsArray[0].addr,
      mockAccountsArray[0],
      false,
    );

    await mockAccountsClass.getCurrentAccount();
    expect(mockAccountsClass.loaded).to.be.true;
    expect(mockAccountsClass.currentAccount).to.deep.equal(
      mockAccountsArray[0],
    );
  });

  it('should return all accounts', async function () {
    let mockStateWithAccounts = {
      currentAccountId: mockAccountsArray[0].addr,
      accounts: mockAccountsArray,
    };
    mockWallet.rpcStubs.snap_manageState
      .withArgs('get')
      .resolves(mockStateWithAccounts);
    let mockAccountsClass = new Accounts(
      mockWallet,
      mockAccountsArray,
      mockAccountsArray[0].addr,
      mockAccountsArray[0],
      false,
    );

    await mockAccountsClass.getAccounts();
    expect(mockAccountsClass.loaded).to.be.true;
    expect(mockAccountsClass.accounts).to.deep.equal(mockAccountsArray);
  });

  it('should clear all accounts', async function () {
    let mockStateWithAccounts = {
      currentAccountId: mockAccountsArray[0].addr,
      accounts: mockAccountsArray,
    };
    mockWallet.rpcStubs.snap_manageState
      .withArgs('get')
      .resolves(mockStateWithAccounts);
    mockWallet.rpcStubs.snap_manageState
      .withArgs('update', { accounts: [] })
      .resolves({});

    let mockAccountsClass = new Accounts(
      mockWallet,
      mockAccountsArray,
      mockAccountsArray[0].addr,
      mockAccountsArray[0],
      false,
    );

    await mockAccountsClass.clearAccounts();
    expect(mockAccountsClass.accounts).to.deep.equal([]);
  });
  it('should convert a bytearray to a hex string', async function () {
    let mockAccountsClass = new Accounts(mockWallet, {}, null, null, false);
    let byteArray = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    let hexString = await mockAccountsClass.toHexString(byteArray);
    expect(hexString).to.equal('0x00010203040506070809');
  });
});
