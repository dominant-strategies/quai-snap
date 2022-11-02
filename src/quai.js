const ethers = require('ethers');
import { QUAI_MAINNET_NETWORK_ID, GetShardFromAddress } from './constants';
import { getBIP44AddressKeyDeriver } from '@metamask/key-tree';

import english from './wordlists/english';
import sha512 from 'js-sha512';

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
      chain = context[0].value;
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
    let url = this.getBaseUrl();
    let context = GetShardFromAddress(addr);
    if (context[0] != undefined) {
      url = context[0].rpc;
    }
    return url;
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
  //must pass address
  async getBalance(addr) {
    let body = {
      jsonrpc: '2.0',
      method: 'eth_getBalance',
      params: [addr, 'latest'],
      id: 1,
    };

    let request = await fetch(this.getChainUrl(addr), {
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
    //this.getChainUrl(this.account.addr)
    let request = await fetch(this.getChainUrl(this.account.addr), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    return await request.json();
  }
  static validateAddress(address) {}

  //Mnemonic phrase helper
  async toUint11Array(secretKey) {
    const buffer11 = [];
    let acc = 0;
    let accBits = 0;
    function add(octet) {
      acc |= octet << accBits;
      accBits += 8;
      if (accBits >= 11) {
        buffer11.push(acc & 0x7ff);
        acc >>= 11;
        accBits -= 11;
      }
    }
    function flush() {
      if (accBits) {
        buffer11.push(acc);
      }
    }

    secretKey.forEach(add);
    flush();
    return buffer11;
  }
  //helper for displayMnemonic
  async applyWords(nums) {
    return nums.map((n) => english[n]);
  }

  async displayMnemonic() {
    const confirm = await this.sendConfirmation(
      'confirm',
      'Are you sure you want to display your mnemonic?',
      'anyone with this mnemonic can spend your funds',
    );

    const bip44Code = 994;
    const bip44Node = await this.wallet.request({
      method: `snap_getBip44Entropy`,
      params: {
        coinType: bip44Code,
      },
    });
    const deriver = await getBIP44AddressKeyDeriver(bip44Node);
    const privkey = await (await deriver(this.account.path)).privateKeyBuffer;
    const mnemonic = await this.secretKeyToMnemonic(privkey);

    if (confirm) {
      this.sendConfirmation('mnemonic', this.account.addr, mnemonic);
      return true;
    } else {
      return false;
    }
  }

  //Helper for displayMnemonic. Computes the final checksum word
  async computeChecksum(secretKey) {
    const hashBuffer = await this.genericHash(secretKey);
    const uint11Hash = await this.toUint11Array(hashBuffer);
    const words = await this.applyWords(uint11Hash);
    return words[0];
  }

  //Helper for computeCheckSum
  async genericHash(secretKey) {
    return sha512.sha512_256.array(secretKey);
  }

  //Helper for display the mnemonic phrase by transforming a secret key to mnemonic
  async secretKeyToMnemonic(secretKey) {
    const uint11Array = await this.toUint11Array(secretKey);
    const words = await this.applyWords(uint11Array);
    const checksumWord = await this.computeChecksum(secretKey);
    return `${words.join(' ')} ${checksumWord}`;
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
    console.log('In Transfer');
    console.log(this.account);
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

      const bip44Code = 994;
      const bip44Node = await this.wallet.request({
        method: `snap_getBip44Entropy`,
        params: [
          {
            coinType: bip44Code,
          },
        ],
      });

      const deriver = await getBIP44AddressKeyDeriver(bip44Node);
      const privkey = await (await deriver(this.account.path)).privateKeyBuffer;

      const ethWallet = new ethers.Wallet(privkey, web3Provider);
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

  //Use ethers wallet and signMessage()
  async signData(data) {
    console.log('Signing Data...: ' + data);
    console.log(this.account);
    //user confirmation for data signing
    confirm = await this.sendConfirmation(
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
      // With Quai Network, baseUrl and chainId will need to be set
      // based on the sending address byte prefix.
      let chainURL = this.getChainUrl(this.account.addr);
      console.log('Calling ' + chainURL + ' for message signing');

      let web3Provider = new ethers.providers.JsonRpcProvider(chainURL, 'any');

      const bip44Code = 994;
      const bip44Node = await this.wallet.request({
        method: `snap_getBip44Entropy`,
        params: {
          coinType: bip44Code,
        },
      });

      const deriver = await getBIP44AddressKeyDeriver(bip44Node);
      const privkey = await (await deriver(this.account.path)).privateKeyBuffer;

      const ethWallet = new ethers.Wallet(privkey, web3Provider);
      let signature = await ethWallet.signMessage(data);
      console.log('Signed data: ' + data);
      console.log('Signature: ' + signature);

      return signature;
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
