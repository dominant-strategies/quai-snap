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
    console.log("this.network: " + this.network)
    switch (this.network) {
      case 'colosseum':
        return (
          'https://rpc.' + chain.replace(/-/g, '') + '.colosseum.quaiscan.io'
        );
      case 'garden':
        return 'https://rpc.' + chain.replace(/-/g, '') + '.garden.quaiscan.io';
      case 'local':
        console.log("chain: " + chain)
        return 'http://localhost:' + chainData.httpPort;
      case 'localhost':
          console.log("chain: " + chain)
          return 'http://localhost:' + chainData.httpPort;
    }
  }

  getChainUrl(addr) {
    console.log("overrideURL: " + this.overrideURL)
    if (this.overrideURL) {
      return this.overrideURL;
    }
    let context = getShardContextForAddress(addr);
    console.log("context: " + context[0].value)
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
    console.log('chainURL: ' + chainURL);
    const web3Provider = new quais.JsonRpcProvider(chainURL);

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
    console.log('privKey: ' + privKey);
    const wallet = new quais.Wallet(privKey, web3Provider);
    console.log('wallet: ' + JSON.stringify(wallet));
    const nonce = await web3Provider.getTransactionCount(address);

    console.log('web3Provider: ' + web3Provider);

    console.log('nonce: ' + nonce);

    return { wallet, nonce };
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
    chainID = 9000,
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

      const { wallet, nonce } = await this.buildProviderWalletAndGetNonce(
        sendingAddress,
      );
    //   let option = {
    //     batchMaxCount: 1
    // };
    //   const provider = new quais.JsonRpcProvider(
    //     'http://localhost:8610',
    //     undefined,
    //     option
    //   );

    //   await provider.ready;

    //   console.log("Good before nonce")
    //   const nonce = await provider.getTransactionCount(
    //     sendingAddress,
    //     'pending',
    //   );

    //   console.log('provider from send: ' + provider);
    //   console.log('nonce from send: ' + nonce);

      if (confirm && nonce !== null) {
        let rawTransaction = {
          to: to,
          value: BigInt(value),
          nonce: nonce,
          gasLimit: BigInt(gasLimit),
          maxFeePerGas: BigInt(Number(maxFeePerGas) * 2),
          maxPriorityFeePerGas: BigInt(maxPriorityFeePerGas),
          type: 0,
          chainId: BigInt(chainID),
        };

        if (fromShard != toShard) {
          rawTransaction.externalGasLimit = BigInt(100000);
          rawTransaction.externalGasPrice = BigInt(Number(maxFeePerGas) * 2);
          rawTransaction.externalGasTip = BigInt(
            Number(maxPriorityFeePerGas) * 2,
          );
          rawTransaction.type = 2;
        }

        console.log('rawTx: ', rawTransaction);

        const tx = await wallet.sendTransaction(rawTransaction);
        console.log('tx result: ', tx);
        return JSON.stringify(tx);
      }
    } catch (error) {
      return JSON.stringify('ERROR: ' + error.message);
    }
  }
}
