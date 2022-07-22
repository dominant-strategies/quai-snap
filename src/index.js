import Accounts from './accounts';
import QuaiSnap from './quai';

module.exports.onRpcRequest = async ({ origin, request }) => {
  console.log('received message');
  const accountLibary = new Accounts(wallet);
  console.log('getting Accounts');
  let accounts = await accountLibary.getAccounts();
  console.log('accounts got : ');
  console.log(accounts);
  let currentAccount = await accountLibary.getCurrentAccount();
  console.log('currentAccount in index', currentAccount);
  let quaiSnap = new QuaiSnap(wallet, currentAccount);
  if (request.hasOwnProperty('testnet')) {
    quaiSnap.setTestnet(request.testnet);
  }

  console.log(request);
  switch (request.method) {
    case 'getAccounts':
      return accountLibary.getAccounts();
    case 'isValidAddress':
      return quaiSnap.isValidAddress(request.address);

    case 'getTransactions':
      return quaiSnap.getTransactions();

    case 'getBalance':
      return quaiSnap.getBalance(request.address);

    case 'createAccountByChain':
      return accountLibary.createNewAccountByChain(request.name, request.chain);

    case 'clearAccounts':
      const clearAccountConfirm = await quaiSnap.sendConfirmation(
        'Clear all accounts?',
        'imported Accounts will be gone forever',
      );
      if (clearAccountConfirm) {
        await accountLibary.clearAccounts();
        quaiSnap.notify('Accounts cleared');
        return 'true';
      }
      return false;

    //display balance in metamask window
    case 'displayBalance':
      return await quaiSnap.sendConfirmation(
        'your balance is',
        request.address,
        (await quaiSnap.getBalance(request.address)).toString() + ' Quai',
      );

    case 'getAddress':
      return quaiSnap.getAddress();

    case 'displayMnemonic':
      return await quaiSnap.displayMnemonic();

    case 'transfer':
      return quaiSnap.Transfer(
        request.to,
        request.amount,
        request.limit,
        request.price,
      );

    case 'getCurrentAccount':
      return await accountLibary.getCurrentAccount();

    case 'createAccount':
      return await accountLibary.createNewAccount();

    case 'generateAllAccounts':
      return await accountLibary.generateAllAccounts();

    case 'generateNumAccounts':
      return await accountLibary.generateNumAccounts(request.amount);

    case 'setCurrentAccount':
      console.log('Setting Current Account', request.address);
      return await accountLibary.setCurrentAccount(request.address);

    case 'getBlockHeight':
      let response = await quaiSnap.getBlockHeight();
      console.log('block height');
      console.log(response);
      return response.result.number;

    case 'signData':
      return quaiSnap.signData(request.data);

    default:
      throw new Error('Method not found.');
  }
};
