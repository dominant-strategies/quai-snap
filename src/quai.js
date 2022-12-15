import {
  QUAI_MAINNET_NETWORK_ID,
  getShardFromAddress,
  getChainData,
} from './constants';
import { getBIP44AddressKeyDeriver } from '@metamask/key-tree';

const quais = require('quais');

export default class Quai {
  constructor(wallet, account) {
    this.wallet = wallet
    this.account = account
    this.baseUrl = 'rpc.quaiscan.io'
    this.baseTestUrl = 'rpc.quaiscan-test.io'
    this.devnet = false
    this.testnet = false
    this.overrideURL = false
    this.bip44Code =  994
  }

  getChainFromAddr(addr) {
    let chain = 'none';
    const context = getShardFromAddress(addr);
    if (context[0] !== undefined) {
      chain = context[0].value;
    }
    return chain;
  }

  getBaseUrl(chain) {
    if (chain === undefined) {
      chain = 'prime';
    }
    if (this.devnet) {
      let chainData = getChainData(chain);
      return 'http://localhost:' + chainData.httpPort;
    }
    return 'https://' + chain + '.' + this.baseUrl;
  }

  getChainUrl(addr) {
    if (this.overrideURL) {
      return this.overrideURL;
    }
    let context = getShardFromAddress(addr);
    let url = this.getBaseUrl(context.value);
    if (context[0] !== undefined && this.devnet === false) {
      url = context[0].rpc;
    }
    return url;
  }

  setDevnet(bool) {
    this.devnet = bool;
  }

  setOverrideURL(url) {
    this.overrideURL = url;
  }

  setTestnet(bool) {
    this.testnet = bool;
    if (bool) {
      this.bip44Code = 1
    } else {
      this.bip44Code = 994
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
      const bip44Node = await this.wallet.request({
        method: 'snap_getBip44Entropy',
        params:
        {
          coinType: this.bip44Code
        }
      })
  
      const deriver = await getBIP44AddressKeyDeriver(bip44Node)
      const privKey = (await deriver(this.account.path)).privateKey
      return privKey
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

  async SendTransaction(to, amount, limit, price, data, abi) {
    try {
      const nonce = await this.getNonce()
      const context = await getShardFromAddress(this.account.addr)
      if (context[0] === undefined) {
        return 'Invalid Address'
      }

      // const shardChainId = QUAI_MAINNET_NETWORK_ID[context[0].value];
      amount = BigInt(parseInt(0.0001));
      // create a payment transaction
      const rawTx = {
        to: '0x2805C79f4590C8dbc573C746aF221F18A9e0dCa4',
        gasLimit: 10000000000,
        gasPrice: 21000,
        value: amount,
        chainId: 9101,
        nonce: '12345',
        data,
      };

      let confirm = await this.checkConfirmation(to, amount, data, abi);

      if (!confirm) {
        return 'user rejected Transaction: error 4001';
      } else {
        const wallet = await this.getWallet()
        const signedTx = await wallet.signTransaction(rawTx)
        const body = {
          jsonrpc: '2.0',
          method: 'quai_sendRawTransaction',
          params: [signedTx],
          id: 1,
        };
        const request = await fetch(this.getChainUrl(this.account.addr), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });

        return await request.json();
      }
    } catch (err) {
      console.error(`Problem found: ${err}`);
      throw err;
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
      const wallet = await this.getWallet()
      const signature = await wallet.signMessage(data)

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
    // const web3Provider = new quais.providers.JsonRpcProvider(chainURL, 'any');
    const web3Provider = new quais.providers.JsonRpcProvider(chainURL, 'any');

    const bip44Node = await this.wallet.request({
      method: 'snap_getBip44Entropy',
      params:
      {
        coinType: this.bip44Code
      }
    })

    const deriver = await getBIP44AddressKeyDeriver(bip44Node);
    const privkey = await (await deriver(this.account.path)).privateKeyBuffer;
    return new quais.Wallet(privkey, web3Provider);
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
    const confirm = await this.wallet.request({
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
