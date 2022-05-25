import Web3 from 'web3';
const ethers = require('ethers');
// const { createAlchemyWeb3 } = require('@alch/alchemy-web3');

export default class Quai {
  constructor(wallet, account) {
    this.wallet = wallet;
    this.account = account;
    this.baseUrl =
      'https://mainnet.infura.io/v3/8aa378e5e12b45d4a26719aa795eccd9';
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

    return await request.json();
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

    // const web3 = createAlchemyWeb3(this.baseUrl);
    // const nonce = await web3.eth.getTransactionCount(myAddress, 'latest'); // nonce starts counting from 0

    amount = BigInt(amount);
    //create a payment transaction
    let rawTx = {
      from: this.account.addr,
      to: receiver,
      gas: '0x76c0', // 30400
      gasPrice: '0x9184e72a000', // 10000000000000
      value: amount, // 2441406250
      chainId: 3,
      nonce: nonce,
    };

    //user confirmation
    confirm = await this.sendConfirmation(
      'confirm Spend',
      'send' + amount + ' QUAI to ' + receiver + '?',
    );
    if (!confirm) {
      return 'user rejected Transaction: error 4001';
    } else {
      // obtain private key
      const bip44Code = '60';
      const bip44Node = await this.wallet.request({
        method: `snap_getBip44Entropy_${bip44Code}`,
        params: [],
      });

      //sign the transaction locally
      // let signedTx = await web3.eth.accounts.signTransaction(rawTx, bip44Node);
      // console.log(signedTx);
      // return signedTx;
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
