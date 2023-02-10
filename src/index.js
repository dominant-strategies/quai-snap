import { getShardForAddress } from './utils';
import Accounts from './accounts';
import QuaiSnap from './quai';
module.exports.onRpcRequest = async ({ origin, request }) => {
  const accountLibary = new Accounts(wallet);
  const currentAccount = await accountLibary.getCurrentAccount();
  const quaiSnap = new QuaiSnap(wallet, currentAccount);
  if (request.hasOwnProperty('params')) {
    if (request.params.hasOwnProperty('devnet') != undefined) {
      await quaiSnap.setDevnet(request.params.devnet);
    }
    if (request.params.hasOwnProperty('overrideurl') != undefined) {
      await quaiSnap.setOverrideURL(request.params.overrideurl);
    }
    if (request.params.hasOwnProperty('testnet') != undefined) {
      await quaiSnap.setTestnet(request.params.testnet);
      await accountLibary.setTestnet(request.params.testnet);
    }
    if (request.params.hasOwnProperty('local') != undefined) {
      await quaiSnap.setLocal(request.params.local);
    }
  }

  const determineTypeOfTransaction = (data) => {
    const fromAddress = currentAccount.addr;
    const toAddress = data.to;
    const fromAddressShard = getShardForAddress(fromAddress);
    const toAddressShard = getShardForAddress(toAddress);
    if (fromAddressShard !== toAddressShard) {
      return false;
    }
    return true;
  };

  switch (request.method) {
    case 'getAccounts':
      return accountLibary.getAccounts();
    case 'isValidAddress':
      return quaiSnap.isValidAddress(request.params.address);

    case 'getTransactions':
      return quaiSnap.getTransactions();

    case 'getBalance':
      return quaiSnap.getBalance(request.params.address);

    case 'createAccountByChain':
      return accountLibary.createNewAccountByChain(
        request.params.name,
        request.params.chain,
      );

    case 'clearAccounts': {
      return await accountLibary.clearAccounts();
    }

    case 'displayBalance':
      return await quaiSnap.sendConfirmation(
        'your balance is',
        request.address,
        (await quaiSnap.getBalance(request.params.address)).toString() +
          ' Quai',
      );

    case 'displayMnemonic':
      return await quaiSnap.displayMnemonic();

    case 'getPrivateKey':
      return await quaiSnap.getPrivateKey();

    case 'getPrivateKeyByAddress':
      return await accountLibary.getPrivateKeyByAddress(request.params.address);

    case 'deleteAccount':
      return await accountLibary.deleteAccount(request.params.address);

    case 'sendTransaction':
      const isExternalTransaction = determineTypeOfTransaction(request.params);
      if (isExternalTransaction) {
        return quaiSnap.SendTransaction(
          request.params.to,
          request.params.value,
          request.params.externalGasLimit,
          request.params.externalGasPrice,
          request.params.externalGasTip,
          request.params.gasLimit,
          request.params.maxFeePerGas,
          request.params.maxPriorityFeePerGas,
        );
      } else {
        return quaiSnap.SendTransaction(
          request.params.to,
          request.params.value,
          request.params.gasLimit,
          request.params.maxFeePerGas,
          request.params.maxPriorityFeePerGas,
        );
      }
    case 'getCurrentAccount':
      return await accountLibary.getCurrentAccount();

    case 'createAccount':
      return await accountLibary.createNewAccount(request.params.name);

    case 'generateAllAccounts':
      return await accountLibary.generateAllAccounts();

    case 'generateNumAccounts':
      return await accountLibary.generateNumAccounts(request.params.amount);

    case 'setCurrentAccount':
      return await accountLibary.setCurrentAccount(request.params.address);

    case 'getBlockHeight': {
      const response = await quaiSnap.getBlockHeight();
      return response.result.number;
    }
    case 'signData':
      return quaiSnap.signData(request.params.data);

    case 'getChainURL':
      return quaiSnap.getChainURL();

    default:
      throw new Error('Method not found.');
  }
};
