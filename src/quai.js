import { getChainData, getShardContextForAddress } from './constants';
import { getBIP44AddressKeyDeriver } from '@metamask/key-tree';
import { getShardForAddress } from './utils';

const quais = require('quais');

export default class Quai {
  constructor(snap, account) {
    this.snap = snap;
    this.account = account;
    this.baseUrl = 'rpc.quaiscan.io';
    this.baseTestUrl = 'rpc.quaiscan-test.io';
    this.devnet = false;
    this.testnet = false;
    this.local = false;
    this.overrideURL = false;
    this.bip44Code = 994;
  }

  getBaseUrl(chain) {
    if (chain === undefined) {
      chain = 'prime';
    }
    if (this.testnet) {
      let chainData = getChainData(chain);
      return 'http://localhost:' + chainData.httpPort;
    }
    return 'https://' + chain + '.' + this.baseUrl;
  }

  getChainUrl(addr) {
    if (this.overrideURL) {
      return this.overrideURL;
    }
    let context = getShardContextForAddress(addr);
    let url = context[0].rpc;
    if (this.devnet) {
      parts = url.split('.');
      url =
        parts[0] + '.' + parts[1] + '.colosseum.' + parts[2] + '.' + parts[3];
    }
    if (this.testnet) {
      parts = url.split('.');
      url = parts[0] + '.' + parts[1] + '.garden.' + parts[2] + '.' + parts[3];
    }
    if (this.local) {
      return 'http://localhost:' + context[0].httpPort;
    }
    return url;
  }

  setDevnet(bool) {
    this.devnet = bool;
  }

  setOverrideURL(url) {
    this.overrideURL = url;
  }

  setLocal(bool) {
    this.local = bool;
  }

  setTestnet(bool) {
    this.testnet = bool;
    if (bool) {
      this.bip44Code = 994;
    } else {
      this.bip44Code = 994;
    }
  }

  async getTransactions() {
    const transactions = await fetch(
      this.getBaseUrl() + '/transactions?address=' + this.account.addr,
    );
    return await transactions.json();
  }

  // must pass address
  async getBalance(addr) {
    const body = {
      jsonrpc: '2.0',
      method: 'quai_getBalance',
      params: [addr, 'latest'],
      id: 1,
    };

    const request = await fetch(this.getChainUrl(addr), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    const res = await request.json();
    return parseInt(res.result, 16);
  }

  async getBlockHeight() {
    // creates a notifican when the transaction is broadcast

    const body = {
      jsonrpc: '2.0',
      method: 'quai_getBlockByNumber',
      params: ['latest', true],
      id: 1,
    };
    // this.getChainUrl(this.account.addr)
    const request = await fetch(this.getChainUrl(this.account.addr), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    return await request.json();
  }

  async getPrivateKey() {
    const confirm = await this.sendConfirmation(
      'Confirm action',
      'Are you sure you want to display your private key?',
      'anyone with this key can spend your funds.',
    );
    if (confirm) {
      const bip44Node = await this.snap.request({
        method: 'snap_getBip44Entropy',
        params: {
          coinType: this.bip44Code,
        },
      });

      const deriver = await getBIP44AddressKeyDeriver(bip44Node);
      const privKey = (await deriver(this.account.path)).privateKey;

      return privKey;
    } else {
      return '';
    }
  }

  // Get params needs to be modified to get Quai Network gas data
  // for when we send transactions.
  async getParams() {
    const request = await fetch(this.getBaseUrl() + '/suggestedParams');
    return await request.json();
  }

  async notify(message) {
    snap.request({
      method: 'snap_notify',
      params: [
        {
          type: 'native',
          message: `${message}`,
        },
      ],
    });
  }

  async SendTransaction(
    to,
    value,
    gasLimit = 21000,
    maxFeePerGas = 1,
    maxPriorityFeePerGas = 1,
    externalGasLimit = 110000,
    externalGasPrice = 2000000000,
    externalGasTip = 2000000000,
  ) {
    try {
      const fromShard = getShardForAddress(this.account.addr);
      const toShard = getShardForAddress(to);
      const currentAccountAddr = this.account.addr;
      console.log('value: ', value);
      const confirm = await this.sendConfirmation(
        'Confirm Transaction',
        'Are you sure you want to sign the following transaction?',
        'From: (' +
          fromShard +
          ') ' +
          currentAccountAddr +
          '\n\n' +
          'To: (' +
          toShard +
          ') ' +
          to +
          +'HELLo' +
          '\n\n' +
          'Amount: ' +
          value +
          ' QWEI',
        '\n\n' + value * 10 ** 18 + ' QUAI',
      );
      if (confirm) {
        let rawTx = {
          to: to,
          from: this.account.addr,
          value: value,
        };
        if (fromShard !== toShard) {
          rawTx = {
            to: to,
            from: this.account.addr,
            value: value,
            externalGasLimit: externalGasLimit,
            externalGasPrice: externalGasPrice,
            externalGasTip: externalGasTip,
            gasLimit: gasLimit,
            maxFeePerGas: maxFeePerGas,
            maxPriorityFeePerGas: maxPriorityFeePerGas,
            type: 2,
          };
        }
        const wallet = await this.getWallet();
        const tx = await snap.sendTransaction(rawTx);
        return JSON.stringify(tx);
      }
    } catch (err) {
      console.log(err);
    }
  }

  // Use quais wallet and signMessage()
  async signData(data) {
    // user confirmation for data signing
    const confirm = await this.sendConfirmation(
      'Sign Data',
      'Sign "' +
        data +
        '" using account address:  ' +
        this.account.addr +
        ' (' +
        this.account.shard +
        ')' +
        ' ?',
    );

    if (!confirm) {
      return 'User rejected data signing: error 4001';
    } else {
      const wallet = await this.getWallet();
      const signature = await snap.signMessage(data);

      return signature;
    }
  }

  async getChainURL() {
    return this.getChainUrl(this.account.addr);
  }

  async getNonce() {
    const body = {
      jsonrpc: '2.0',
      method: 'quai_getTransactionCount',
      params: [this.account.addr, 'latest'],
      id: 1,
    };
    const request = await fetch(this.getChainUrl(this.account.addr), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const res = await request.json();
    return res.result;
  }

  async getWallet() {
    const chainURL = this.getChainUrl(this.account.addr);
    const web3Provider = new quais.providers.JsonRpcProvider(chainURL);
    const bip44Node = await this.snap.request({
      method: 'snap_getBip44Entropy',
      params: {
        coinType: this.bip44Code,
      },
    });

    const deriver = await getBIP44AddressKeyDeriver(bip44Node);
    const privKey = (await deriver(this.account.path)).privateKey;
    return new quais.Wallet(privKey, web3Provider);
  }

  async checkConfirmation(to, value, data, abi) {
    let confirm = undefined;
    if (data.length > 0 && abi !== undefined) {
      try {
        const iface = new quais.utils.Interface(abi);
        const decodedData = iface.parseTransaction({
          data: data,
          value: value,
        });
        confirm = await this.sendConfirmation(
          'Confirm Contract Call',
          'Interact with ' +
            to +
            ' ?\n' +
            'This interaction will ' +
            decodedData.functionFragment.name +
            ' with args ' +
            decodedData.args,
        );
      } catch (err) {
        console.error(`Problem found: ${err}`);
        throw err;
      }
    } else if (data.length > 0) {
      confirm = await this.sendConfirmation(
        'Confirm Contract Call',
        'Interact with ' +
          to +
          ' ?\n' +
          'This interaction does provided an ABI to decode payload',
      );
    } else {
      // user confirmation
      confirm = await this.sendConfirmation(
        'confirm Spend',
        'send' + value + ' QUAI to ' + to + '?',
      );
    }
    return confirm;
  }

  async sendConfirmation(prompt, description, textAreaContent) {
    const confirm = await this.snap.request({
      method: 'snap_confirm',
      params: [
        {
          prompt,
          description,
          textAreaContent,
        },
      ],
    });
    return confirm;
  }
}
