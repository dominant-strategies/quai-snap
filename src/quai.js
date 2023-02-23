import { getChainData, getShardContextForAddress } from './constants';
import { getBIP44AddressKeyDeriver } from '@metamask/key-tree';
import { getShardForAddress } from './utils';

const quais = require('quais');

export default class Quai {
  constructor(account) {
    this.account = account;
    this.network = "colosseum";
    this.overrideURL = false;
    this.bip44Code = 994;
  }

  getBaseUrl(chain) {
    if (chain === undefined) {
      chain = 'prime';
    }
    switch (this.network){
      case "colosseum":
        return 'https://rpc.' + chain.replace(/-/g, '') + '.colosseum.quaiscan.io';
      case "garden":
        return 'https://rpc.' + chain.replace(/-/g, '') + '.garden.quaiscan.io';
      case "local":
        let chainData = getChainData(chain);
        return 'http://localhost:' + chainData.httpPort;
    }
  }
  
  getChainUrl(addr) {
    if (this.overrideURL) {
      return this.overrideURL;
    }
    let context = getShardContextForAddress(addr);
    return this.getBaseUrl(context[0].value)
  }

  setNetwork(network) {
    this.network = network;
  }

  setOverrideURL(url) {
    this.overrideURL = url;
  }

  async getPrivateKey() {
    const confirm = await this.sendConfirmation(
      'Confirm action',
      'Are you sure you want to display your private key?',
      'anyone with this key can spend your funds.',
    );
    if (confirm) {
      const bip44Node = await snap.request({
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
    data = null,
    abi = null,
  ) {
    try {
      const currentAccountAddr = this.account.addr;
      const fromShard = getShardForAddress(currentAccountAddr)[0].value;
      const toShard = getShardForAddress(to)[0].value;

      const valueInQuai = value * 10 ** -18;

      let confirm;
      if (data !== null) {
        confirm = await this.sendConfirmation(
          'Confirm Contract Transaction',
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
            '\n\n' +
            'Amount: ' +
            value +
            ' QWEI',
          '\n\n' + 'Data: ' + data + '\n\n' + 'ABI: ' + abi,
        );
      } else {
        confirm = await this.sendConfirmation(
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
            '\n\n' +
            'Amount: ' +
            value +
            ' QWEI',
          '\n\n' + valueInQuai + ' QUAI',
        );
      }
      if (confirm) {
        let rawTx = {
          to: to,
          from: this.account.addr,
          value: value,
          maxFeePerGas: maxFeePerGas,
          maxPriorityFeePerGas: maxPriorityFeePerGas,
          gasLimit: gasLimit,
          data: data,
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
            data: data,
          };
        }
        const wallet = await this.getWallet();
        const tx = await wallet.sendTransaction(rawTx);
        return JSON.stringify(tx);
      }
    } catch (err) {
      console.log(err);
    }
  }

  async signData(data) {
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
      const signature = await wallet.signMessage(data);

      return signature;
    }
  }

  async getChainURL() {
    return this.getChainUrl(this.account.addr);
  }

  async getWallet() {
    const chainURL = this.getChainUrl(this.account.addr);
    const web3Provider = new quais.providers.JsonRpcProvider(chainURL);
    const bip44Node = await snap.request({
      method: 'snap_getBip44Entropy',
      params: {
        coinType: this.bip44Code,
      },
    });
    console.log("BIP CODE", this.bip44Code)
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
    const result = await snap.request({
      method: 'snap_confirm',
      params: [
        {
          prompt: prompt,
          description: description,
          textAreaContent: textAreaContent,
        },
      ],
    });
    return result;
  }
}
