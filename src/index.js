import Accounts from './accounts'
import QuaiSnap from './quai'

module.exports.onRpcRequest = async ({ origin, request }) => {
  const accountLibary = new Accounts(wallet)
  const currentAccount = await accountLibary.getCurrentAccount()
  const quaiSnap = new QuaiSnap(wallet, currentAccount)
  if (request.hasOwnProperty('params')) {
    if (request.params.hasOwnProperty('devnet') != undefined) {
      quaiSnap.setDevnet(request.params.devnet);
    }
    if (request.params.hasOwnProperty('overrideurl') != undefined) {
      quaiSnap.setOverrideURL(request.params.overrideurl);
    }
  }
  console.log(request)
  switch (request.method) {
    case 'getAccounts':
      return accountLibary.getAccounts()
    case 'isValidAddress':
      return quaiSnap.isValidAddress(request.params.address)

    case 'getTransactions':
      return quaiSnap.getTransactions()

    case 'getBalance':
      console.log('getBalance')
      console.log(request.params.address)
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
      console.log('Setting Current Account', request.params.address)
      return await accountLibary.setCurrentAccount(request.params.address)

    case 'getBlockHeight': {
      const response = await quaiSnap.getBlockHeight()
      console.log('block height')
      console.log(response)
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
