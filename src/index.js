import Accounts from './accounts';
import QuaiSnap from './quai';

wallet.registerRpcMessageHandler(async (originString, requestObject) => {
  console.log('received message');
  const accountLibary = new Accounts(wallet);
  console.log('getting Accounts');
  let accounts = await accountLibary.getAccounts();
  console.log('accounts got : ');
  console.log(accounts);
  let currentAccount = await accountLibary.getCurrentAccount();

  let quaiSnap = new QuaiSnap(wallet, currentAccount);
  if (requestObject.hasOwnProperty('testnet')) {
    quaiSnap.setTestnet(requestObject.testnet);
  }
  switch (requestObject.method) {
    case 'getAccounts':
      return accountLibary.getAccounts();
    case 'isValidAddress':
      return quaiSnap.isValidAddress(requestObject.address);

    case 'getTransactions':
      return quaiSnap.getTransactions();

    case 'getBalance':
      return quaiSnap.getBalance();

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
        quaiSnap.getAddress(),
        (await quaiSnap.getBalance()).toString() + ' Quai',
      );

    case 'signData':
      let pk = account.sk;
      console.log('request data');
      console.log(requestObject.data);
      let out = nacl.sign(new Uint8Array(requestObject.data), account.sk);
      return out;

    case 'getAddress':
      return quaiSnap.getAddress();

    case 'displayMnemonic':
      return await quaiSnap.displayMnemonic();

    case 'transfer':
      return quaiSnap.Transfer(requestObject.to, requestObject.amount);

    case 'getAccount':
      return await getAccount();

    case 'createAccount':
      return await accountLibary.createNewAccount();

    default:
      throw new Error('Method not found.');
  }
});
