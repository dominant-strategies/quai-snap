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
      'https://rpc.cyprus.colosseum.quaiscan.io',
    );
    expect(quai.getChainUrl(mockAccountsArray[0].addr)).to.equal(
      'https://rpc.prime.colosseum.quaiscan.io',
    );
    quai.setNetwork('garden');
    expect(quai.getChainUrl(mockAccountsArray[1].addr)).to.equal(
      'https://rpc.cyprus.garden.quaiscan.io',
    );
  });

  it('should send a confirmation request', async () => {
    global.snap = mockWallet;
    //have snap_confirm resolve true
    mockWallet.rpcStubs.snap_confirm.resolves(true);
    let confirmationRequest = await quai.sendConfirmation(
      'test prompt',
      'test description',
      'test text area content',
    );
    expect(mockWallet.rpcStubs.snap_confirm).to.have.been.calledOnce;
    expect(confirmationRequest).to.equal(true);
  });

  it('should be able to set devnet', () => {
    quai.setNetwork('garden');
    expect(quai.network).to.equal('garden');
  });

  it('should sign data and return a signature', async () => {
    mockWallet.rpcStubs.snap_confirm.resolves(true);
    mockWallet.rpcStubs.snap_getBip44Entropy.resolves(bip44Entropy);
    let data = 'test data';
    let signature = await quai.signData(data);
    expect(signature).to.equal(
      '0xbb299f575d34a5e614383b23bbae95933b9705cf879de4c20c60dff4b6625a6936be0e270f5532bcefeaead5de3921db0ee50dc74ddc28bfdf8862be5c83c3a91c',
    );
    expect(mockWallet.rpcStubs.snap_confirm).to.have.been.calledOnce;
  });

  it('should send a transaction', async () => {
    global.snap = mockWallet;
    quai.getWallet = () => mockWallet;
    mockWallet.sendTransaction.resolves(
      '0x1234567890123456789012345678901234567890123456789012345678901234',
    );
    mockWallet.rpcStubs.snap_confirm.resolves(true);
    mockWallet.rpcStubs.snap_getBip44Entropy.callsFake(getBip44EntropyStub);
    let txHash = await quai.SendTransaction(
      '0x1234567890123456789012345678901234567890',
      '0x1',
    );
    expect(txHash).to.equal(
      '0x1234567890123456789012345678901234567890123456789012345678901234',
    );
    expect(mockWallet.rpcStubs.snap_confirm).to.have.been.calledOnce;
  });
});
