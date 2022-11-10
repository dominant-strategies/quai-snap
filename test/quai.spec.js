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
    quai.setDevnet(true);
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

  it('should display mnemonic with a metamask confirmation', async () => {
    let quai = new Quai(mockWallet, mockAccountsArray[13]);
    mockWallet.rpcStubs.snap_confirm.resolves(true);
    mockWallet.rpcStubs.snap_getBip44Entropy.resolves(bip44Entropy);
    let req = await quai.displayMnemonic();
    expect(mockWallet.rpcStubs.snap_confirm).to.have.been.calledTwice;
    expect(req).to.equal(true);
  });

  it('should be able to set testnet and devnet', () => {
    let quai = new Quai(mockWallet, mockAccountsArray[2]);
    quai.setTestnet(true);
    quai.setDevnet(true);
    expect(quai.testnet).to.equal(true);
    expect(quai.devnet).to.equal(true);
  });

  it('should sign data and return a signature', async () => {
    let quai = new Quai(mockWallet, mockAccountsArray[13]);
    mockWallet.rpcStubs.snap_confirm.resolves(true);
    mockWallet.rpcStubs.snap_getBip44Entropy.resolves(bip44Entropy);
    let data = 'test data';
    let signature = await quai.signData(data);
    expect(signature).to.equal("0xde468b0b6663869192d9d0ef826e61c65509bbb2c6f2bd1c8b3ffae29e8d1286198392470ae7b29ef825839fa55ea0b3cb6220742cbf7ba19abada7f9a0a28871b");
    expect(mockWallet.rpcStubs.snap_confirm).to.have.been.calledOnce;
  });

  it('should correctly compute checkSum, get a generic hash and derive a mnemonic phrase', async () => {
    let quai = new Quai(mockWallet, mockAccountsArray[13]);
    const myBuffer = Buffer.from("NDBiNmQ4ZmM1YWFiYjA1YjEyZjczNGVlZWYwNDFiYjFhMzdiZTZiZTVmZjQ1OWUwY2VjMWU5OGQ1OTRjYmMwYg==", 'base64');
    let mnemonic = await quai.secretKeyToMnemonic(myBuffer);
    expect(mnemonic).to.equal(
      "alley match brass main small flee answer gesture era screen box bike good sunset often crouch protect night creek drink give obtain mention gentle toy match crawl casino skull minute creek crucial chase neutral oblige file short era sleep deal prosper tooth old change short metal adapt damp",
    );
  });


});
