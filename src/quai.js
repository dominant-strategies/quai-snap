import Web3 from 'web3';
const ethers = require('ethers');

export default class Quai {
  constructor(wallet, account) {
    this.wallet = wallet;
    this.account = account;
    this.baseUrl = 'https://rpc.quaiscan.io';
    this.testnet = false;
  }
  getBaseUrl() {
    if (this.testnet) {
      return this.getBaseUrl;
    }
    return this.baseUrl;
  }
  setTestnet(bool) {
    this.testnet = bool;
  }
  async getTransactions() {
    let transactions = await fetch(
      this.getBaseUrl() + '/transactions?address=' + this.account.addr,
    );
    return await transactions.json();
  }
  async getBalance() {
    let body = {
      jsonrpc: '2.0',
      method: 'eth_getBalance',
      params: [this.account.addr, 'latest'],
      id: 1,
    };
    let request = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    let res = await request.json();
    console.log(res);
    return parseInt(res.result, 16);
  }
  async getBlockHeight() {
    console.log('Attempting to get block height...');

    //creates a notifican when the transaction is broadcast

    let body = {
      jsonrpc: '2.0',
      method: 'eth_getBlockByNumber',
      params: ['latest', true],
      id: 1,
    };
    let request = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    return await request.json();
  }
  static validateAddress(address) {}
  async displayMnemonic() {
    const confirm = await this.sendConfirmation(
      'confirm',
      'Are you sure you want to display your mnemonic?',
      'anyone with this mnemonic can spend your funds',
    );
    if (confirm) {
      this.sendConfirmation(
        'mnemonic',
        this.account.addr,
        algo.secretKeyToMnemonic(this.account.sk),
      );
      return true;
    } else {
      return false;
    }
  }
  getAddress() {
    return this.account.addr;
  }
  // Get params needs to be modified to get Quai Network gas data
  // for when we send transactions.
  async getParams() {
    let request = await fetch(this.getBaseUrl() + '/suggestedParams');
    return await request.json();
  }
  async notify(message) {
    wallet.request({
      method: 'snap_notify',
      params: [
        {
          type: 'native',
          message: `${message}`,
        },
      ],
    });
  }
  // Potentiall deprecated if we choose to use the ethers library
  // for signing and sending transactions.
  async broadcastTransaction(txn) {
    //creates a notifican when the transaction is broadcast

    let body = {
      jsonrpc: '2.0',
      method: 'eth_getBlockByNumber',
      params: [txn],
      id: 1,
    };

    fetch(this.getBaseUrl() + '/broadcastV2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }).then((res) =>
      res.text().then((res) => {
        this.notify(res);
      }),
    );
    return txn.txID;
  }
  async Transfer(receiver, amount) {
    // TODO: Get suggested gas price
    // let params = await this.getParams();

    console.log('Here');
    let body = {
      jsonrpc: '2.0',
      method: 'eth_getTransactionCount',
      params: [this.account.addr, 'latest'],
      id: 1,
    };
    let request = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    let res = await request.json();
    let nonce = res.result;
    console.log('Nonce');
    console.log(res.result);

    amount = BigInt(amount);
    //create a payment transaction
    let rawTx = {
      to: receiver,
      gasLimit: '0x76c0', // 30400
      gasPrice: '0x9184e72a000', // 10000000000000
      value: amount, // 2441406250
      chainId: 1,
      nonce: 1,
    };

    //user confirmation
    confirm = await this.sendConfirmation(
      'confirm Spend',
      'send' + amount + ' QUAI to ' + receiver + '?',
    );
    if (!confirm) {
      return 'user rejected Transaction: error 4001';
    } else {
      // With Quai Network, baseUrl and chainId will need to be set
      // based on the sending address byte prefix.
      let chainId = 1;
      let web3Provider = new ethers.providers.JsonRpcProvider(
        this.baseUrl,
        chainId,
      );

      // obtain private key
      const privKey = await wallet.request({
        method: 'snap_getAppKey',
      });
      const ethWallet = new ethers.Wallet(privKey, web3Provider);

      //sign the transaction locally
      let sendTx = await ethWallet.sendTransaction(rawTx);
      console.log(await sendTx);
      return signedTx;
    }
  }
  async signTxns(txns) {}

  async sendConfirmation(prompt, description, textAreaContent) {
    const confirm = await this.wallet.request({
      method: 'snap_confirm',
      params: [
        {
          prompt: prompt,
          description: description,
          textAreaContent: textAreaContent,
        },
      ],
    });
    return confirm;
  }
}
