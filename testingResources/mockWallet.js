import sinon from 'sinon';

export default class MockWallet {
  registerRpcMessageHandler = sinon.stub();
  requestStub = sinon.stub();
  sendTransaction = sinon.stub();
  rpcStubs = {
    snap_dialog: sinon.stub(),
    snap_getBip44Entropy: sinon.stub(),
    snap_manageState: sinon.stub(),
    web3_clientVersion: sinon.stub(),
    snap_getBip32PublicKey: sinon.stub(),
  };

  request(args) {
    let _a;
    const method = args.method;
    const params = args.params;
    if (Object.hasOwnProperty.call(this.rpcStubs, method)) {
      if (Array.isArray(params)) {
        return (_a = this.rpcStubs)[method].apply(_a, params);
      } else {
        return this.rpcStubs[method](params);
      }
    }
    return this.requestStub(args);
  }

  reset() {
    this.registerRpcMessageHandler.reset();
    this.requestStub.reset();
    Object.values(this.rpcStubs).forEach((stub) => stub.reset());
  }
}
