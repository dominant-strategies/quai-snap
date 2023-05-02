import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import MockWallet from '../testingResources/mockWallet';
import Quai from '../src/quai';
import {
  mockAccountsArray,
  getBip44EntropyStub,
  bip44Entropy,
} from '../testingResources/testConstantsAndHelpers';

chai.use(sinonChai);
const sandbox = sinon.createSandbox();

describe('Quai.js tests', () => {
  const mockWallet = new MockWallet();
  let quai = new Quai(mockAccountsArray[2]);
  global.snap = mockWallet;

  beforeEach(() => async () => {
    quai = new Quai(mockAccountsArray[2]);
    mockWallet.rpcStubs.snap_getBip44Entropy.callsFake(getBip44EntropyStub);
    global.snap = mockWallet;
  });

  afterEach(() => {
    mockWallet.reset();
    sandbox.restore();
  });

  it('should initialize the Quai class', () => {
    expect(quai.account).to.equal(mockAccountsArray[2]);
  });

  it('should get base url', () => {
    expect(quai.getBaseUrl()).to.equal(
      'https://rpc.prime.colosseum.quaiscan.io',
    );
    expect(quai.getBaseUrl('cyprus-1')).to.equal(
      'https://rpc.cyprus1.colosseum.quaiscan.io',
    );
    quai.setNetwork('local');
    expect(quai.getBaseUrl('cyprus-1')).to.equal('http://localhost:8610');
    quai.setNetwork('garden');
    expect(quai.getBaseUrl('cyprus-1')).to.equal(
      'https://rpc.cyprus1.garden.quaiscan.io',
    );
  });

  it('should get chain url', () => {
    quai.setNetwork('colosseum');
    expect(quai.getChainUrl(mockAccountsArray[1].addr)).to.equal(
      'https://rpc.cyprus2.colosseum.quaiscan.io',
    );
    expect(quai.getChainUrl(mockAccountsArray[0].addr)).to.equal(
      'https://rpc.cyprus1.colosseum.quaiscan.io',
    );
    quai.setNetwork('garden');
    expect(quai.getChainUrl(mockAccountsArray[1].addr)).to.equal(
      'https://rpc.cyprus2.garden.quaiscan.io',
    );
  });

  it('should send a confirmation request', async () => {
    global.snap = mockWallet;
    //have snap_confirm resolve true
    mockWallet.rpcStubs.snap_dialog.resolves(true);
    let confirmationRequest = await quai.sendConfirmation(
      'test prompt',
      'test description',
      'test text area content',
    );
    expect(mockWallet.rpcStubs.snap_dialog).to.have.been.calledOnce;
    expect(confirmationRequest).to.equal(true);
  });

  it('should be able to set devnet', () => {
    quai.setNetwork('garden');
    expect(quai.network).to.equal('garden');
  });

  it('should sign data and return a signature', async () => {
    mockWallet.rpcStubs.snap_dialog.resolves(true);
    mockWallet.rpcStubs.snap_getBip44Entropy.resolves(bip44Entropy);
    let data = 'test data';
    let signature = await quai.signData(data);
    expect(signature).to.equal(
      '0x881d74a4e7bd57e648d0d1f08afe0ec59740bb97a231030526df8db3797e0b337846905e6cdbf755ae6357727b97cbdc4090f1c83942cf1b354e71a2cedc06241c',
    );
    expect(mockWallet.rpcStubs.snap_dialog).to.have.been.calledOnce;
  });

  it('should send a transaction', async () => {
    global.snap = mockWallet;
    quai.getWallet = () => mockWallet;
    mockWallet.sendTransaction.resolves(
      '0x1234567890123456789012345678901234567890123456789012345678901234',
    );
    mockWallet.rpcStubs.snap_dialog.resolves(true);
    mockWallet.rpcStubs.snap_getBip44Entropy.callsFake(getBip44EntropyStub);
    let txHash = await quai.SendTransaction(
      '0x1234567890123456789012345678901234567890',
      '0x1',
    );
    expect(txHash).to.equal(
      '"0x1234567890123456789012345678901234567890123456789012345678901234"',
    );
    expect(mockWallet.rpcStubs.snap_dialog).to.have.been.calledOnce;
  });
});
