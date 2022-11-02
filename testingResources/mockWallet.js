import sinon from 'sinon';

export default class MockWallet {
  constructor() {
    this.registerRpcMessageHandler = sinon.stub();
    this.requestStub = sinon.stub();
    this.rpcStubs = {
      snap_confirm: sinon.stub(),
      snap_getBip44Entropy: sinon.stub(),
      snap_manageState: sinon.stub(),
      web3_clientVersion: sinon.stub(),
    };
  }
  request(args) {
    var _a;
    var method = args.method,
      params = args.params;
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
