import chai, { assert, expect } from 'chai'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import MockWallet from '../testingResources/mockWallet'
import {
  mockAccountsArray,
  getBip44EntropyStub,
  testShardsToFind
} from '../testingResources/testConstantsAndHelpers'
import Accounts from '../src/accounts'

chai.use(sinonChai)
const sandbox = sinon.createSandbox()

describe('Accounts.js Tests', function () {
  const mockWallet = new MockWallet()

  beforeEach(async function () {
    mockWallet.rpcStubs.snap_getBip44Entropy.callsFake(getBip44EntropyStub)
  })

  afterEach(function () {
    mockWallet.reset()
    sandbox.restore()
  })

  it('should initialize the Accounts class', function () {
    const mockAccounts = new Accounts(mockWallet, {}, null, null, false)

    assert.equal(mockAccounts.wallet, mockWallet)
    expect(mockAccounts.accounts).to.be.empty
    assert.equal(mockAccounts.currentAccountId, null)
  })

  it('should load no accounts when there are no accounts in state', async function () {
    mockWallet.rpcStubs.snap_manageState.withArgs('get').resolves({})
    const accountsClass = new Accounts(mockWallet, {}, null, null, false)

    await accountsClass.load()
    expect(accountsClass.loaded).to.be.true
    expect(mockWallet.rpcStubs.snap_manageState).to.have.been.calledOnceWith(
      'get'
    )
    expect(accountsClass.accounts).to.be.empty
    expect(accountsClass.currentAccountId).to.be.null
  })

  it('should load all accounts when there are accounts in state', async function () {
    const mockStateWithAccounts = {
      currentAccountId: mockAccountsArray[0].addr,
      accounts: mockAccountsArray
    }
    mockWallet.rpcStubs.snap_manageState
      .withArgs('get')
      .resolves(mockStateWithAccounts)
    const accountsClass = new Accounts(
      mockWallet,
      mockAccountsArray,
      mockAccountsArray[0].addr,
      mockAccountsArray[0],
      false
    )

    await accountsClass.load()
    expect(accountsClass.loaded).to.be.true
    expect(mockWallet.rpcStubs.snap_manageState).to.have.been.calledOnceWith(
      'get'
    )
    expect(accountsClass.accounts).to.deep.equal(mockAccountsArray)
  })

  it('should load all accounts when there are accounts in state but no current account is set', async function () {
    const mockStateWithAccounts = {
      currentAccountId: null,
      accounts: mockAccountsArray
    }
    mockWallet.rpcStubs.snap_manageState
      .withArgs('get')
      .resolves(mockStateWithAccounts)
    const accountsClass = new Accounts(
      mockWallet,
      mockAccountsArray,
      null,
      null,
      false
    )

    await accountsClass.load()
    expect(accountsClass.loaded).to.be.true
    expect(mockWallet.rpcStubs.snap_manageState).to.have.been.calledOnceWith(
      'get'
    )
    expect(accountsClass.accounts).to.deep.equal(mockAccountsArray)
  })

  it('should return the current account', async function () {
    const mockStateWithAccounts = {
      currentAccountId: mockAccountsArray[0].addr,
      accounts: mockAccountsArray
    }
    mockWallet.rpcStubs.snap_manageState
      .withArgs('get')
      .resolves(mockStateWithAccounts)
    const accountsClass = new Accounts(
      mockWallet,
      mockAccountsArray,
      mockAccountsArray[0].addr,
      mockAccountsArray[0],
      false
    )

    await accountsClass.getCurrentAccount()
    expect(accountsClass.loaded).to.be.true
    expect(accountsClass.currentAccount).to.deep.equal(mockAccountsArray[0])
  })

  it('should return null when trying to get current account when there are no accounts', async function () {
    mockWallet.rpcStubs.snap_manageState.withArgs('get').resolves({})
    const accountsClass = new Accounts(mockWallet, [], null, null, false)

    await accountsClass.getCurrentAccount()
    expect(accountsClass.loaded).to.be.true
    expect(accountsClass.currentAccount).to.be.null
  })

  it('should set the current account', async function () {
    const mockStateWithAccounts = {
      currentAccountId: mockAccountsArray[0].addr,
      accounts: mockAccountsArray
    }
    mockWallet.rpcStubs.snap_manageState
      .withArgs('get')
      .resolves(mockStateWithAccounts)
    const accountsClass = new Accounts(
      mockWallet,
      mockAccountsArray,
      mockAccountsArray[0].addr,
      mockAccountsArray[0],
      true
    )

    await accountsClass.setCurrentAccount(mockAccountsArray[1].addr)
    expect(accountsClass.currentAccountId).to.deep.equal(
      mockAccountsArray[1].addr
    )
  })

  it('should return all accounts', async function () {
    const mockStateWithAccounts = {
      currentAccountId: mockAccountsArray[0].addr,
      accounts: mockAccountsArray
    }
    mockWallet.rpcStubs.snap_manageState
      .withArgs('get')
      .resolves(mockStateWithAccounts)
    const accountsClass = new Accounts(
      mockWallet,
      mockAccountsArray,
      mockAccountsArray[0].addr,
      mockAccountsArray[0],
      false
    )

    await accountsClass.getAccounts()
    expect(accountsClass.loaded).to.be.true
    expect(accountsClass.accounts).to.deep.equal(mockAccountsArray)
  })

  it('should clear all accounts', async function () {
    const mockStateWithAccounts = {
      currentAccountId: mockAccountsArray[0].addr,
      accounts: mockAccountsArray
    }
    mockWallet.rpcStubs.snap_manageState
      .withArgs('get')
      .resolves(mockStateWithAccounts)
    mockWallet.rpcStubs.snap_manageState
      .withArgs('update', { accounts: [] })
      .resolves({})

    const accountsClass = new Accounts(
      mockWallet,
      mockAccountsArray,
      mockAccountsArray[0].addr,
      mockAccountsArray[0],
      false
    )

    await accountsClass.clearAccounts()
    expect(accountsClass.accounts).to.deep.equal([])
  })

  it('should generate an account given a name', async function () {
    const mockStateWithAccounts = {
      currentAccountId: mockAccountsArray[0].addr,
      accounts: mockAccountsArray
    }
    mockWallet.rpcStubs.snap_manageState
      .withArgs('get')
      .resolves(mockStateWithAccounts)

    const accountsClass = new Accounts(
      mockWallet,
      mockAccountsArray,
      mockAccountsArray[0].addr,
      mockAccountsArray[0],
      false
    )

    await accountsClass.createNewAccount('Test Account')
    expect(
      accountsClass.accounts[accountsClass.accounts.length - 1].name
    ).to.equal('Test Account')
  })

  it('should generate an account with the name Account + number when given no name', async function () {
    const mockStateWithAccounts = {
      currentAccountId: mockAccountsArray[0].addr,
      accounts: mockAccountsArray
    }
    mockWallet.rpcStubs.snap_manageState
      .withArgs('get')
      .resolves(mockStateWithAccounts)

    const accountsClass = new Accounts(
      mockWallet,
      mockAccountsArray,
      mockAccountsArray[0].addr,
      mockAccountsArray[0],
      false
    )

    await accountsClass.createNewAccount()
    expect(
      accountsClass.accounts[accountsClass.accounts.length - 1].name
    ).to.equal('Account 16')
  })

  it('should generate an account with a given name and chainId', async function () {
    const mockStateWithAccounts = {
      currentAccountId: mockAccountsArray[0].addr,
      accounts: mockAccountsArray
    }
    mockWallet.rpcStubs.snap_manageState
      .withArgs('get')
      .resolves(mockStateWithAccounts)

    const accountsClass = new Accounts(
      mockWallet,
      mockAccountsArray,
      mockAccountsArray[0].addr,
      mockAccountsArray[0],
      false
    )

    await accountsClass.createNewAccountByChain('Test Account', 'paxos')
    expect(
      accountsClass.accounts[accountsClass.accounts.length - 1].name
    ).to.equal('Test Account')
    expect(
      accountsClass.accounts[accountsClass.accounts.length - 1].shard
    ).to.equal('Paxos')
  })

  it('should check if an account exists', async function () {
    const mockStateWithAccounts = {
      currentAccountId: mockAccountsArray[0].addr,
      accounts: mockAccountsArray
    }
    mockWallet.rpcStubs.snap_manageState
      .withArgs('get')
      .resolves(mockStateWithAccounts)

    const accountsClass = new Accounts(
      mockWallet,
      mockAccountsArray,
      null,
      null,
      false
    )

    await accountsClass.doesAccountExist(mockAccountsArray[0].addr)
    expect(accountsClass.accounts).to.deep.equal(mockAccountsArray)
  })

  it('should accurately check shards to find', async function () {
    const accountsClass = new Accounts(
      mockWallet,
      mockAccountsArray,
      mockAccountsArray[0].addr,
      mockAccountsArray[0],
      true
    )

    const result = await accountsClass.checkShardsToFind(testShardsToFind)
    expect(result).to.be.true
  })

  it('should generate an account given a path', async function () {
    const accountsClass = new Accounts(
      mockWallet,
      mockAccountsArray,
      mockAccountsArray[0].addr,
      mockAccountsArray[0],
      false
    )

    const generatedAccount = await accountsClass.generateAccount(14)
    expect(generatedAccount).to.have.property('addr')
    expect(generatedAccount).to.have.property('path')
  })

  it('should generate a specified number of accounts', async function () {
    const mockStateWithAccounts = {
      currentAccountId: mockAccountsArray[0].addr,
      accounts: mockAccountsArray
    }

    mockWallet.rpcStubs.snap_manageState
      .withArgs('get')
      .resolves(mockStateWithAccounts)

    const accountsClass = new Accounts(
      mockWallet,
      mockAccountsArray,
      mockAccountsArray[0].addr,
      mockAccountsArray[0],
      false
    )
    const mockAccountsArrayLengthBefore = mockAccountsArray.length
    const result = await accountsClass.generateNumAccounts(2)
    expect(result.accounts).to.have.lengthOf(mockAccountsArrayLengthBefore + 2)
  })

  it('should generate all accounts', async function () {
    const mockStateWithAccounts = {
      currentAccountId: mockAccountsArray[0].addr,
      accounts: mockAccountsArray
    }

    mockWallet.rpcStubs.snap_manageState
      .withArgs('get')
      .resolves(mockStateWithAccounts)

    const accountsClass = new Accounts(
      mockWallet,
      mockAccountsArray,
      mockAccountsArray[0].addr,
      mockAccountsArray[0],
      false
    )
    const result = await accountsClass.generateAllAccounts()
    expect(result.accounts).to.have.lengthOf(13)
  })

  it('should convert a bytearray to a hex string', async function () {
    const accountsClass = new Accounts(mockWallet, {}, null, null, false)
    const byteArray = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
    const hexString = await accountsClass.toHexString(byteArray)
    expect(hexString).to.equal('0x00010203040506070809')
  })

  it('should delete an account', async function () {
    const mockStateWithAccounts = {
      currentAccountId: mockAccountsArray[0].addr,
      accounts: mockAccountsArray
    }

    mockWallet.rpcStubs.snap_manageState
      .withArgs('get')
      .resolves(mockStateWithAccounts)

    const accountsClass = new Accounts(
      mockWallet,
      { ...mockAccountsArray },
      mockAccountsArray[0].addr,
      mockAccountsArray[0],
      false
    )
    await accountsClass.load()
    let length_old = accountsClass.accounts.length
    const result = await accountsClass.deleteAccount(mockAccountsArray[0].addr)
    expect(result).to.equal(true)
    expect(mockWallet.rpcStubs.snap_manageState).to.have.been.calledTwice
    expect(accountsClass.accounts).to.have.lengthOf(length_old - 1)
  })
})
