import chai, { assert, expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import MockWallet from '../testingResources/mockWallet';
import {
  mockAccountsArray,
  getBip44EntropyStub,
  fakeAddressPubKeys,
} from '../testingResources/testConstantsAndHelpers';
import { shardsToFind } from '../src/constants';
import Accounts from '../src/accounts';

chai.use(sinonChai);
const sandbox = sinon.createSandbox();

//Note: ordering of tests is relevant due to the changing of shardsToFind state by the functions we are testing
describe('Accounts.js Tests', function () {
  const mockWallet = new MockWallet();
  let testShardsToFind = {};
  const emptyShardsToFind = { ...shardsToFind };

  beforeEach(async function () {
    mockWallet.rpcStubs.snap_getBip44Entropy.callsFake(getBip44EntropyStub);
    testShardsToFind = { ...emptyShardsToFind };

    global.snap = mockWallet;
  });

  afterEach(function () {
    mockWallet.reset();
    sandbox.restore();
  });

  it('should initialize the Accounts class', function () {
    const mockAccounts = new Accounts([], {}, null, null, false);
    expect(mockAccounts.accounts).to.be.empty;
    assert.equal(mockAccounts.currentAccountId, null);
  });

  it('should load no accounts when there are no accounts in state', async function () {
    mockWallet.rpcStubs.snap_manageState
      .withArgs({ operation: 'get' })
      .resolves(null);
    const accountsClass = new Accounts([], {}, null, null, false);
    await accountsClass.load();

    expect(mockWallet.rpcStubs.snap_manageState).to.have.been.calledOnceWith({
      operation: 'get',
    });

    expect(accountsClass.loaded).to.be.true;
    expect(accountsClass.accounts).to.be.empty;
    expect(accountsClass.currentAccountId).to.be.null;
  });

  it('should load all accounts when there are accounts in state', async function () {
    const mockStateWithAccounts = {
      currentAccountId: mockAccountsArray[0].addr,
      accounts: mockAccountsArray,
    };
    mockWallet.rpcStubs.snap_manageState
      .withArgs({ operation: 'get' })
      .resolves(mockStateWithAccounts);
    const accountsClass = new Accounts(
      mockWallet,
      mockAccountsArray,
      mockAccountsArray[0].addr,
      mockAccountsArray[0],
      false,
    );

    await accountsClass.load();
    expect(accountsClass.loaded).to.be.true;
    expect(mockWallet.rpcStubs.snap_manageState).to.have.been.calledOnceWith({
      operation: 'get',
    });
    expect(accountsClass.accounts).to.deep.equal(mockAccountsArray);
  });

  it('should load all accounts when there are accounts in state but no current account is set', async function () {
    const mockStateWithAccounts = {
      currentAccountId: null,
      accounts: mockAccountsArray,
    };
    mockWallet.rpcStubs.snap_manageState
      .withArgs({ operation: 'get' })
      .resolves(mockStateWithAccounts);
    const accountsClass = new Accounts(
      mockWallet,
      mockAccountsArray,
      null,
      null,
      false,
    );

    await accountsClass.load();
    expect(accountsClass.loaded).to.be.true;
    expect(mockWallet.rpcStubs.snap_manageState).to.have.been.calledOnceWith({
      operation: 'get',
    });
    expect(accountsClass.accounts).to.deep.equal(mockAccountsArray);
  });

  it('should return the current account', async function () {
    const mockStateWithAccounts = {
      currentAccountId: mockAccountsArray[0].addr,
      accounts: mockAccountsArray,
    };
    mockWallet.rpcStubs.snap_manageState
      .withArgs({ operation: 'get' })
      .resolves(mockStateWithAccounts);
    const accountsClass = new Accounts(
      mockWallet,
      mockAccountsArray,
      mockAccountsArray[0].addr,
      mockAccountsArray[0],
      false,
    );

    await accountsClass.getCurrentAccount();
    expect(accountsClass.loaded).to.be.true;
    expect(accountsClass.currentAccount).to.deep.equal(mockAccountsArray[0]);
  });

  it('should return null when trying to get current account when there are no accounts', async function () {
    mockWallet.rpcStubs.snap_manageState.withArgs('get').resolves({});
    const accountsClass = new Accounts(mockWallet, [], null, null, false);

    await accountsClass.getCurrentAccount();
    expect(accountsClass.loaded).to.be.true;
    expect(accountsClass.currentAccount).to.be.null;
  });

  it('should set the current account', async function () {
    const mockStateWithAccounts = {
      currentAccountId: mockAccountsArray[0].addr,
      accounts: mockAccountsArray,
    };
    mockWallet.rpcStubs.snap_manageState
      .withArgs({ operation: 'get' })
      .resolves(mockStateWithAccounts);
    const accountsClass = new Accounts(
      mockWallet,
      mockAccountsArray,
      mockAccountsArray[0].addr,
      mockAccountsArray[0],
      true,
    );

    await accountsClass.setCurrentAccount(mockAccountsArray[1].addr);
    expect(accountsClass.currentAccountId).to.deep.equal(
      mockAccountsArray[1].addr,
    );
  });

  it('should return all accounts', async function () {
    const mockStateWithAccounts = {
      currentAccountId: mockAccountsArray[0].addr,
      accounts: mockAccountsArray,
    };
    mockWallet.rpcStubs.snap_manageState
      .withArgs({ operation: 'get' })
      .resolves(mockStateWithAccounts);
    const accountsClass = new Accounts(
      mockWallet,
      mockAccountsArray,
      mockAccountsArray[0].addr,
      mockAccountsArray[0],
      false,
    );

    await accountsClass.getAccounts();
    expect(accountsClass.loaded).to.be.true;
    expect(accountsClass.accounts).to.deep.equal(mockAccountsArray);
  });

  it('should clear all accounts', async function () {
    const mockStateWithAccounts = {
      currentAccountId: mockAccountsArray[0].addr,
      accounts: mockAccountsArray,
    };
    mockWallet.rpcStubs.snap_manageState
      .withArgs({ operation: 'get' })
      .resolves(mockStateWithAccounts);
    mockWallet.rpcStubs.snap_manageState
      .withArgs({ operation: 'update', newState: { accounts: [] } })
      .resolves({});

    const accountsClass = new Accounts(
      mockWallet,
      mockAccountsArray,
      mockAccountsArray[0].addr,
      mockAccountsArray[0],
      false,
    );

    await accountsClass.clearAccounts();
    expect(accountsClass.accounts).to.deep.equal([]);
  });

  it('should accurately check shards to find', async function () {
    const accountsClass = new Accounts(
      mockAccountsArray,
      mockAccountsArray[0].addr,
      mockAccountsArray[0],
      true,
    );

    const result = await accountsClass.checkShardsToFind(testShardsToFind);
    expect(result).to.be.true;
  });

  it('should generate all accounts', async function () {
    const mockStateWithAccounts = {
      currentAccountId: null,
      accounts: [],
    };

    mockWallet.rpcStubs.snap_manageState
      .withArgs({ operation: 'get' })
      .resolves(mockStateWithAccounts);

    mockWallet.rpcStubs.snap_getBip32PublicKey.callsFake(async (input) => {
      const { path } = input;
      const index = parseInt(path[path.length - 1]);
      return fakeAddressPubKeys[index];
    });

    const accountsClass = new Accounts(
      mockAccountsArray,
      mockAccountsArray[0].addr,
      mockAccountsArray[0],
      false,
    );
    const result = await accountsClass.generateAllAccounts();
    expect(result.accounts).to.have.lengthOf(9);
  });

  it('should generate an account with a given name and chainId', async function () {
    const mockStateWithAccounts = {
      currentAccountId: mockAccountsArray[0].addr,
      accounts: mockAccountsArray,
    };
    mockWallet.rpcStubs.snap_manageState
      .withArgs({ operation: 'get' })
      .resolves(mockStateWithAccounts);
    mockWallet.rpcStubs.snap_getBip32PublicKey.resolves(
      '0x04f2e98f9084a48c8d21186004bc4e8d771fa3af7baaa9b2dad3f1f42775a6e23ac02130a0aa0cc21b39acb489d910e0de4ffd516451516764aaada8b859808fda',
    );
    const accountsClass = new Accounts(
      mockAccountsArray,
      mockAccountsArray[0].addr,
      mockAccountsArray[0],
      false,
    );
    await accountsClass.createNewAccountByChain('Test Account', 'paxos-2');
    expect(
      accountsClass.accounts[accountsClass.accounts.length - 1].name,
    ).to.equal('Test Account');
    expect(
      accountsClass.accounts[accountsClass.accounts.length - 1].shard,
    ).to.equal('Paxos-2');
  });

  it('should check if an account exists', async function () {
    const mockStateWithAccounts = {
      currentAccountId: mockAccountsArray[0].addr,
      accounts: mockAccountsArray,
    };
    mockWallet.rpcStubs.snap_manageState
      .withArgs({ operation: 'get' })
      .resolves(mockStateWithAccounts);

    const accountsClass = new Accounts(mockAccountsArray, null, null, false);

    await accountsClass.doesAccountExist(mockAccountsArray[0].addr);
    expect(accountsClass.accounts).to.deep.equal(mockAccountsArray);
  });

  it('should generate an account given a path', async function () {
    mockWallet.rpcStubs.snap_getBip32PublicKey.resolves(
      '0x04105803a4c03ca78991b96e4e4d0af8abe1bd22ae78295490ccc25954b3e6b97e8c1f96243e3faa8e4b1aab8b688f5f327409afb6d68d24d76b3b7436619b00a1',
    );
    const accountsClass = new Accounts(
      mockAccountsArray,
      mockAccountsArray[0].addr,
      mockAccountsArray[0],
      false,
    );

    const generatedAccount = await accountsClass.generateAccount(14);
    expect(generatedAccount).to.have.property('addr');
    expect(generatedAccount).to.have.property('path');
  });

  it('should get private key for an address', async function () {
    const mockStateWithAccounts = {
      currentAccountId: mockAccountsArray[3].addr,
      accounts: mockAccountsArray,
    };
    mockWallet.rpcStubs.snap_manageState
      .withArgs({ operation: 'get' })
      .resolves(mockStateWithAccounts);
    mockWallet.rpcStubs.snap_dialog.resolves(true);
    const accountsClass = new Accounts();
    accountsClass.accounts = mockAccountsArray;
    accountsClass.currentAccount = mockAccountsArray[3];
    accountsClass.currentAccountId = mockAccountsArray[3].addr;
    accountsClass.load();
    await accountsClass.getPrivateKeyByAddress(mockAccountsArray[3].addr);
    expect(mockWallet.rpcStubs.snap_dialog).to.have.been.calledTwice;
  });

  it('should rename an account', async function () {
    const mockStateWithAccounts = {
      currentAccountId: mockAccountsArray[0].addr,
      accounts: mockAccountsArray,
    };
    mockWallet.rpcStubs.snap_manageState
      .withArgs({ operation: 'get' })
      .resolves(mockStateWithAccounts);
    const accountsClass = new Accounts();
    accountsClass.accounts = mockAccountsArray;
    accountsClass.currentAccount = mockAccountsArray[0];
    accountsClass.currentAccountId = mockAccountsArray[0].addr;
    accountsClass.load();
    await accountsClass.renameAccount(mockAccountsArray[0].addr, 'New Name');
    expect(accountsClass.accounts[0].name).to.equal('New Name');
  });
});
