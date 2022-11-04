import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import MockWallet from '../testingResources/mockWallet';
import Quai from '../src/quai';
import {
  mockAccountsArray,
  getBip44EntropyStub,
} from '../testingResources/testConstantsAndHelpers';

chai.use(sinonChai);
const sandbox = sinon.createSandbox();

describe('Quai.js tests', () => {
  const mockWallet = new MockWallet();

  beforeEach(() => async () => {
    mockWallet.rpcStubs.snap_getBip44Entropy.callsFake(getBip44EntropyStub);
  });

  afterEach(() => {
    mockWallet.reset();
    sandbox.restore();
  });

  it('should initialize the Quai class', () => {
    let quai = new Quai(mockWallet, mockAccountsArray[2]);
    expect(quai.wallet).to.equal(mockWallet);
    expect(quai.account).to.equal(mockAccountsArray[2]);
  });

  it('should get chain from address', () => {
    let quai = new Quai(mockWallet, mockAccountsArray[2]);
    expect(quai.getChainFromAddr(mockAccountsArray[2].addr)).to.equal(
      'cyprus-1',
    );
    expect(quai.getChainFromAddr(mockAccountsArray[0].addr)).to.equal('prime');
  });

  it('should get base url', () => {
    let quai = new Quai(mockWallet, mockAccountsArray[2]);
    expect(quai.getBaseUrl()).to.equal('https://prime.rpc.quaiscan.io');
    expect(quai.getBaseUrl('cyprus-1')).to.equal(
      'https://cyprus-1.rpc.quaiscan.io',
    );
  });

  it('should get chain url', () => {
    let quai = new Quai(mockWallet, mockAccountsArray[2]);
    expect(quai.getChainUrl(mockAccountsArray[2].addr)).to.equal(
      'https://cyprus1.rpc.quaiscan.io/',
    );
    expect(quai.getChainUrl(mockAccountsArray[0].addr)).to.equal(
      'https://prime.rpc.quaiscan.io/',
    );
  });

  it('should send a confirmation request', async () => {
    let quai = new Quai(mockWallet, mockAccountsArray[2]);
    mockWallet.rpcStubs.snap_confirm.resolves(true);
    let confirmationRequest = await quai.sendConfirmation(
      'test prompt',
      'test description',
      'test text area content',
    );
    expect(mockWallet.rpcStubs.snap_confirm).to.have.been.calledOnce;
    expect(confirmationRequest).to.equal(true);
  });

  it('should get the address of the account', () => {
    let quai = new Quai(mockWallet, mockAccountsArray[2]);
    expect(quai.getAddress()).to.equal(mockAccountsArray[2].addr);
  });
});
