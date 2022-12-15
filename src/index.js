import Accounts from './accounts'
import QuaiSnap from './quai'

module.exports.onRpcRequest = async ({ origin, request }) => {
  const accountLibary = new Accounts(wallet)
  const currentAccount = await accountLibary.getCurrentAccount()
  const quaiSnap = new QuaiSnap(wallet, currentAccount)
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
  }

  switch (request.method) {
    case 'getAccounts':
      return accountLibary.getAccounts()
    case 'isValidAddress':
      return quaiSnap.isValidAddress(request.params.address)

    case 'getTransactions':
      return quaiSnap.getTransactions()

    case 'getBalance':
      return quaiSnap.getBalance(request.params.address)

    case 'createAccountByChain':
      return accountLibary.createNewAccountByChain(request.params.name, request.params.chain)

    case 'clearAccounts': {
      const clearAccountConfirm = await quaiSnap.sendConfirmation(
        'Clear all accounts?',
        'imported Accounts will be gone forever'
      )
      if (clearAccountConfirm) {
        await accountLibary.clearAccounts()
        quaiSnap.notify('Accounts cleared')
        return 'true'
      }
      return false
    }

    // display balance in metamask window
    case 'displayBalance':
      return await quaiSnap.sendConfirmation(
        'your balance is',
        request.address,
        (await quaiSnap.getBalance(request.params.address)).toString() + ' Quai'
      )

    case 'getAddress':
      return quaiSnap.getAddress()

    case 'displayMnemonic':
      return await quaiSnap.displayMnemonic()

    case 'getPrivateKey':
      return await quaiSnap.getPrivateKey()

    case 'deleteAccount':
      return await accountLibary.deleteAccount(request.params.address)

    case 'sendTransaction':
      return quaiSnap.SendTransaction(
        request.params.to,
        request.params.amount,
        request.params.limit,
        request.params.price,
        request.params.data,
        request.params.abi
      )

    case 'getCurrentAccount':
      return await accountLibary.getCurrentAccount()

    case 'createAccount':
      return await accountLibary.createNewAccount(request.params.name)

    case 'generateAllAccounts':
      return await accountLibary.generateAllAccounts()

    case 'generateNumAccounts':
      return await accountLibary.generateNumAccounts(request.params.amount)

    case 'setCurrentAccount':
      return await accountLibary.setCurrentAccount(request.params.address)

    case 'getBlockHeight': {
      const response = await quaiSnap.getBlockHeight()
      return response.result.number
    }
    case 'signData':
      return quaiSnap.signData(request.params.data)

    case 'getChainURL':
      return quaiSnap.getChainURL()

    default:
      throw new Error('Method not found.')
  }
}
