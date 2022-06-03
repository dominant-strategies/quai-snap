import Web3 from 'web3';
const ethers = require('ethers');
import { QUAI_MAINNET_NETWORK_ID, GetShardFromAddress } from './constants';

export default class Quai {
  constructor(wallet, account) {
    this.wallet = wallet;
    this.account = account;
    this.baseUrl = 'rpc.quaiscan.io';
    this.baseTestUrl = 'rpc.quaiscan-test.io';
    this.testnet = false;
  }
  getChainFromAddr(addr) {
    let chain = 'none';
    let context = GetShardFromAddress(addr);
    if (context[0] != undefined) {
      chain = context[0].chain;
    }
    return chain;
  }
  getBaseUrl(chain) {
    if (chain == undefined) {
      chain = 'prime';
    }
    if (this.testnet) {
      return 'https://' + chain + '.' + this.baseTestUrl;
    }
    return 'https://' + chain + '.' + this.baseUrl;
  }
  getChainUrl(addr) {
    let chain = this.getChainFromAddr(addr);
    return this.getBaseUrl(chain);
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

    let request = await fetch(this.getChainUrl(this.account.addr), {
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

    fetch(this.getChainUrl(this.account.addr) + '/broadcastV2', {
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
  async Transfer(receiver, amount, limit, price) {
    let body = {
      jsonrpc: '2.0',
      method: 'eth_getTransactionCount',
      params: [this.account.addr, 'latest'],
      id: 1,
    };
    let request = await fetch(this.getChainUrl(this.account.addr), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    let res = await request.json();
    let nonce = res.result;

    let context = GetShardFromAddress(this.account.addr);

    if (context[0] == undefined) {
      return 'Invalid Address';
    }

    let shardChainId = QUAI_MAINNET_NETWORK_ID[context[0].value];
    amount = BigInt(parseInt(amount));
    //create a payment transaction
    let rawTx = {
      to: receiver,
      gasLimit: limit,
      gasPrice: price,
      value: amount,
      chainId: shardChainId,
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
      // With Quai Network, baseUrl and chainId will need to be set
      // based on the sending address byte prefix.
      let chainURL = this.getChainUrl(this.account.addr);
      console.log('Calling ' + chainURL + ' for tx');
      let web3Provider = new ethers.providers.JsonRpcProvider(chainURL, 'any');

      // obtain private key
      const privKey = await wallet.request({
        method: 'snap_getAppKey',
      });
      const ethWallet = new ethers.Wallet(privKey, web3Provider);

      let signedTx = await ethWallet.signTransaction(rawTx);

      let body = {
        jsonrpc: '2.0',
        method: 'eth_sendRawTransaction',
        params: [signedTx],
        id: 1,
      };
      let request = await fetch(this.getChainUrl(this.account.addr), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      let result = await request.json();
      console.log(result);

      return result;
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
