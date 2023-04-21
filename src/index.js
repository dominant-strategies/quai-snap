import Accounts from './accounts';
import QuaiSnap from './quai';
import { getShardForAddress } from './utils';
export const onRpcRequest = async ({ origin, request }) => {
  const accountLib = new Accounts();
  const currentAccount = await accountLib.getCurrentAccount();
  const quaiSnap = new QuaiSnap(currentAccount);

  if (request.hasOwnProperty('params')) {
    if (request.params.hasOwnProperty('network') != undefined) {
      await quaiSnap.setNetwork(request.params.network);
    }
    if (request.params.hasOwnProperty('overrideurl') != undefined) {
      await quaiSnap.setOverrideURL(request.params.overrideurl);
    }
  }

  switch (request.method) {
    case 'generateAllAccounts':
      return await accountLib.generateAllAccounts();
    case 'getAccounts':
      return await accountLib.getAccounts();
    case 'getCurrentAccount':
      return await accountLib.getCurrentAccount();
    case 'setCurrentAccount':
      return await accountLib.setCurrentAccount(request.params.address);
    case 'createAccountByChain':
      return await accountLib.createNewAccountByChain(
        request.params.name,
        request.params.chain,
      );
    case 'clearAccounts':
      return await accountLib.clearAccounts();
    case 'getPrivateKeyByAddress':
      return await accountLib.getPrivateKeyByAddress(request.params.address);
    case 'getPrivateKeyByPath':
      return await accountLib.getPrivateKeyByPath(request.params.path);
    case 'getBaseUrl':
      return await quaiSnap.getBaseUrl();
    case 'renameAccount':
      return await accountLib.renameAccount(
        request.params.address,
        request.params.name,
      );
    case 'sendTransaction':
      return quaiSnap.SendTransaction(
        request.params.toAddress,
        request.params.value,
        request.params.gasLimit,
        request.params.maxFeePerGas,
        request.params.maxPriorityFeePerGas,
        request.params.externalGasLimit,
        request.params.externalGasPrice,
        request.params.externalGasTip,
        request.params.data,
        request.params.abi,
      );

    case 'signData':
      return quaiSnap.signData(request.params.data);
    case 'getChainURL':
      return quaiSnap.getChainURL();
    case 'getPrivateKeyByAddress':
      return await accountLib.getPrivateKeyByAddress(request.params.address);
    default:
      throw new Error('Method not found.');
  }
};
