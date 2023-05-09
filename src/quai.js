import { getChainData, getShardContextForAddress } from './constants';
import { getBIP44AddressKeyDeriver } from '@metamask/key-tree';
import { getShardForAddress } from './utils';
import { panel, text, heading } from '@metamask/snaps-ui';

const quais = require('quais');

export default class Quai {
  constructor(account) {
    this.account = account;
    this.network = 'colosseum';
    this.overrideURL = false;
    this.bip44Code = 1;
  }

  getBaseUrl(chain) {
    if (chain === undefined) {
      chain = 'prime';
    }
    let chainData = getChainData(chain);
    switch (this.network) {
      case 'colosseum':
        return (
          'https://rpc.' + chain.replace(/-/g, '') + '.colosseum.quaiscan.io'
        );
      case 'garden':
        return 'https://rpc.' + chain.replace(/-/g, '') + '.garden.quaiscan.io';
      case 'local':
        return 'http://localhost:' + chainData.httpPort;
      case 'localhost':
        return 'http://localhost:' + chainData.httpPort;
    }
  }

  getChainUrl(addr) {
    if (this.overrideURL) {
      return this.overrideURL;
    }
    let context = getShardContextForAddress(addr);
    return this.getBaseUrl(context[0].value);
  }

  setNetwork(network) {
    this.network = network;
  }

  setOverrideURL(url) {
    this.overrideURL = url;
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

  async sendRawTxFetchRequest(chainURL, signedTransaction) {
    try {
      const response = await fetch(chainURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'quai_sendRawTransaction',
          params: [signedTransaction],
          id: 1,
        }),
      });

      const result = await response.json();
      if (result.error) {
        return JSON.stringify('ERROR: ' + result.error.message);
      } else {
        return JSON.stringify('SUCCESS: ' + result.result);
      }
    } catch (error) {
      return JSON.stringify('ERROR: ' + error.message);
    }
  }

  async signData(data) {
    const confirm = await this.sendConfirmation(
      'Sign Data',
      'Data: "' + data + '"',
      'Account: ' + ' (' + this.account.shard + ')\n' + this.account.addr,
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

  async buildProviderWalletAndGetNonce(address) {
    const chainURL = this.getChainUrl(address);
    const web3Provider = new quais.providers.JsonRpcProvider(chainURL);

    if (chainURL === undefined) {
      return;
    }
    const bip44Node = await snap.request({
      method: 'snap_getBip44Entropy',
      params: {
        coinType: this.bip44Code,
      },
    });
    const deriver = await getBIP44AddressKeyDeriver(bip44Node);
    const privKey = (await deriver(this.account.path)).privateKey;
    const wallet = new quais.Wallet(privKey, web3Provider);
    return wallet;
  }

  async sendConfirmation(prompt, description, textAreaContent) {
    const result = await snap.request({
      method: 'snap_dialog',
      params: {
        type: 'confirmation',
        content: panel([
          heading(prompt),
          text(description),
          text(textAreaContent),
        ]),
      },
    });
    return result;
  }

  async SendTransaction(
    to,
    value,
    gasLimit = 42000,
    maxFeePerGas = 1,
    maxPriorityFeePerGas = 1,
    externalGasLimit = 110000,
    externalGasPrice = 2000000000,
    externalGasTip = 2000000000,
    data = null,
    abi,
  ) {
    try {
      const valueInQuai = value * 10 ** -18;
      const sendingAddress = this.account.addr;
      const fromShard = getShardForAddress(sendingAddress)[0].value;
      const toShard = getShardForAddress(to)[0].value;
      let confirm;

      if (data !== null) {
        confirm = await this.sendConfirmation(
          'Confirm Contract Transaction',
          'Are you sure you want to sign the following transaction?',
          'From: (' +
            fromShard +
            ') ' +
            sendingAddress +
            '\n\n' +
            'To: (' +
            toShard +
            ') ' +
            to +
            '\n\n' +
            'Amount: ' +
            valueInQuai +
            ' QUAI',
          '\n\n' + 'Data: ' + data + '\n\n' + 'ABI: ' + abi,
        );
      } else {
        confirm = await this.sendConfirmation(
          'Confirm Transaction',
          'From: (' +
            fromShard +
            ')\n' +
            sendingAddress +
            '\n\n' +
            'To: (' +
            toShard +
            ') \n' +
            to +
            '\n\n',
          'Amount: ' + valueInQuai + ' QUAI',
        );
      }

      console.log('sendingAddress: ' + sendingAddress);

      const wallet = await this.buildProviderWalletAndGetNonce(sendingAddress);

      if (confirm) {
        let rawTransaction = {
          to: to,
          value: BigInt(value),
          gasLimit: BigInt(gasLimit),
          maxFeePerGas: BigInt(Number(maxFeePerGas) * 2),
          maxPriorityFeePerGas: BigInt(maxPriorityFeePerGas),
          type: 0,
        };

        if (fromShard != toShard) {
          rawTransaction.externalGasLimit = BigInt(externalGasLimit);
          rawTransaction.externalGasPrice = BigInt(Number(externalGasPrice));
          rawTransaction.externalGasTip = BigInt(
            Number(externalGasTip),
          );
          rawTransaction.type = 2;
        }

        const tx = await wallet.sendTransaction(rawTransaction);
        return JSON.stringify(tx);
      }
    } catch (error) {
      return JSON.stringify('ERROR: ' + error.message);
    }
  }
}
