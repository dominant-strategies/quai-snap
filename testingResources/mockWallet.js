import sinon from 'sinon';
import chai, { expect } from 'chai';
import {
  testNewBip44Entropy,
  testNewMetamaskVersion,
} from './keyPairTestConstants';

class MockWallet {
  constructor() {
    this.registerRpcMessageHandler = sinon.stub();
    this.requestStub = sinon.stub();
    this.rpcStubs = {
      snap_confirm: sinon.stub(),
      snap_getBip44Entropy_994: sinon.stub(),
      snap_manageState: sinon.stub(),
      web3_clientVersion: sinon.stub(),
    };
  }
  request(args) {
    const { method, params = [] } = args;
    if (Object.hasOwnProperty.call(this.rpcStubs, method)) {
      return this.rpcStubs[method](...params);
    }
    return this.requestStub(args);
  }
  reset() {
    this.registerRpcMessageHandler.reset();
    this.requestStub.reset();
    Object.values(this.rpcStubs).forEach((stub) => stub.reset());
  }
  prepareFoKeyPair() {
    this.rpcStubs.snap_manageState.withArgs('get').resolves({
      quai: {
        config: {
          derivationPath: "m/44'/994'/0'/0/0",
          network: 'f',
        },
      },
    });
    this.rpcStubs.snap_getBip44Entropy_461.resolves(testNewBip44Entropy);
    this.rpcStubs.web3_clientVersion.resolves(testNewMetamaskVersion);
  }
}
export function mockSnapProvider() {
  const mock = new MockWallet();
  return mock;
}
