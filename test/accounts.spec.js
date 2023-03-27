import chai, { assert, expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import MockWallet from '../testingResources/mockWallet';
import {
  mockAccountsArray,
  getBip44EntropyStub,
  bip32PublicKeyStub,
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
    // mockWallet.rpcStubs.snap_getBip32PublicKey.callsFake(bip32PublicKeyStub);
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

    // write this resolve so that is resolves a function
    mockWallet.rpcStubs.snap_getBip32PublicKey.callsFake(async (input) => {
      const fakeAddressPubKeys = [
        '0x0490f663621f14950f4ad8287e6211895dc21089d9a3d41cd2de5665c3ced1ea087602159972aec9aec29413ecff55930fecca3de027c1ee2b24c631c41eb4761b',
        '0x04f76aec041d0bbf89cf252ee3e44baf96e2dfa2b445329f927255b952f85201f8d252c9fc5230dec60fc0856c76c9835cebd225b54669585d1fe9836dee7e0b35',
        '0x0427e4793563f7b74e022a1aff7990d07d397feb7ac17b3b2ee80aaa2179737c605ba35c4f3bbd824aa302d1150e4044123476ab8ee64f5d5f2b11072dbc0a980c',
        '0x047a290f2b4127973b77ae86719e0907b0c4bd9a732bf054f8aabf3f149c00dc62670ca92125f1717c0277375e6c41e245d5bb00184587d1609595d0cf4d6cade9',
        '0x047d7dc54b8533dba80140120acf53b4d50484bab5db838251b421e821ca33f25f621eaf8fa67315d26239fd4d9b42a0507f538e094f97a2d8b5bb9cdf35eb6540',
        '0x04d9a3bcff69f16d8409615f748e2406a442c9c868942fb19e7d3212c67dfb1ec7012304b4464cf1d8188abb35e9da996b216a244df885646bca9be08a129a5fca',
        '0x04e574086acc5ddbf29e0371ae6512b9668cf125fb2645c16ad53ab4dca5c8644c24d195fbb25bf60e2426cd50454aec2e2a6cff38c800b224d78c33d02b02909c',
        '0x04e5fa0a4a8ea8845d3c6c73e506e9cd17c731f0f9f35accefd5fd827e47beeb0eee63448fc30b2f17bc790c8a6d658a4bfea0cf3add038f162b0e8d0d192aa5b4',
        '0x04b98e07a6eb9e60e1945fc503d2e0cb7c8a7be63765e8678d2d6a18cf3b356ca048b377a2d39a961f5b039c91ff0210d5ab6d85f657b4878cc6dfeeb92d706f56',
        '0x04c5bd085b89f5cfe85ba9747af526be4692b59e692d276c707935616cdcf2ad9c6ee6362dc8abc7b6cc654302734aa227dd962905c85b660bcead85883118758f',
        '0x04c154d3f8daaecaf6265a1f23eb9da7bcbc2d6f448740e02207054e6ed10028ede4337fc6240a7891c6b1b086ef0f7d8bde47dae0434d235940b5a3becc69a6c5',
        '0x04105803a4c03ca78991b96e4e4d0af8abe1bd22ae78295490ccc25954b3e6b97e8c1f96243e3faa8e4b1aab8b688f5f327409afb6d68d24d76b3b7436619b00a1',
        '0x04d28960f4d4477381c140e8689276a6eee6a9b0a014c20504ff6fcb0ac7f4bc24f6992bf749590bce0247c8915e378a23df12190bd622a4302f4275ff0b1238ad',
      ];
      const { path } = input;
      const index = path[path.length - 1];
      return fakeAddressPubKeys[index];
    });

    const accountsClass = new Accounts(
      mockAccountsArray,
      mockAccountsArray[0].addr,
      mockAccountsArray[0],
      false,
    );
    const result = await accountsClass.generateAllAccounts();
    expect(result.accounts).to.have.lengthOf(13);
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
      '0x04105803a4c03ca78991b96e4e4d0af8abe1bd22ae78295490ccc25954b3e6b97e8c1f96243e3faa8e4b1aab8b688f5f327409afb6d68d24d76b3b7436619b00a1',
    );
    const accountsClass = new Accounts(
      mockAccountsArray,
      mockAccountsArray[0].addr,
      mockAccountsArray[0],
      false,
    );
    await accountsClass.createNewAccountByChain('Test Account', 'paxos');
    expect(
      accountsClass.accounts[accountsClass.accounts.length - 1].name,
    ).to.equal('Test Account');
    expect(
      accountsClass.accounts[accountsClass.accounts.length - 1].shard,
    ).to.equal('Paxos');
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
    mockWallet.rpcStubs.snap_confirm.resolves(true);
    const accountsClass = new Accounts();
    accountsClass.accounts = mockAccountsArray;
    accountsClass.currentAccount = mockAccountsArray[3];
    accountsClass.currentAccountId = mockAccountsArray[3].addr;
    accountsClass.load();
    await accountsClass.getPrivateKeyByAddress(mockAccountsArray[3].addr);
    expect(mockWallet.rpcStubs.snap_confirm).to.have.been.calledTwice;
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
