import { getBIP44AddressKeyDeriver } from '@metamask/key-tree';
import { panel, text, heading } from '@metamask/snaps-ui';

import { getShardContextForAddress, shardsToFind } from './constants';
import { removeWhitespace } from './utils';
const quais = require('quais');

export default class Accounts {
  constructor() {
    this.accounts = [];
    this.currentAccountId = null;
    this.currentAccount = null;
    this.loaded = false;
    this.bip44Code = 1;
  }

  async load() {
    // load acount Data
    const storedAccounts = await snap.request({
      method: 'snap_manageState',
      params: { operation: 'get' },
    });
    if (
      storedAccounts === null ||
      storedAccounts === undefined ||
      Object.keys(storedAccounts).length === 0
    ) {
      this.loaded = true;
      return {
        currentAccountId: this.currentAccountId,
        accounts: this.accounts,
      };
    } else {
      this.accounts = storedAccounts.accounts;
      if (storedAccounts.currentAccountId === null) {
        this.currentAccount = this.accounts[this.accounts.length - 1];
      } else {
        for (let i = 0; i < storedAccounts.accounts.length; i++) {
          if (
            storedAccounts.accounts[i].addr === storedAccounts.currentAccountId
          ) {
            this.currentAccount = storedAccounts.accounts[i];
          }
        }
      }
      this.currentAccountId = this.currentAccount.addr;
      this.loaded = true;

      return storedAccounts;
    }
  }

  async checkShardsToFind() {
    for (const shard in shardsToFind) {
      if (shardsToFind[shard].found === false) {
        return true;
      }
    }
    return false;
  }

  async generateAccount(index) {
    const path = [
      'm',
      "44'",
      this.bip44Code.toString() + "'",
      "0'",
      '0',
      index.toString(),
    ];

    const addressPubKey = await snap.request({
      method: 'snap_getBip32PublicKey',
      params: {
        path,
        curve: 'secp256k1',
        compressed: false,
      },
    });
    if (addressPubKey === null || addressPubKey === undefined) {
      throw new Error(
        'Could not generate account, addressPubKey is null or undefined',
      );
    }
    let Account = {};
    Account.addr = quais.computeAddress(addressPubKey);
    Account.path = index;

    return Account;
  }

  async generateAllAccounts() {
    let i = 0;
    let Account = null;
    let address = null;
    let found = false;
    while (!found && (await this.checkShardsToFind())) {
      Account = await this.generateAccount(i);
      if (Account.addr !== null) {
        let address = Account.addr;
        const context = getShardContextForAddress(address);
        // If this address exists in a shard, check to see if we haven't found it yet.
        if (
          context[0] !== undefined &&
          shardsToFind[context[0].value].found === false
        ) {
          this.currentAccount = Account;
          this.currentAccountId = Account.addr;
          const shard = context[0].value;
          const readableShard = removeWhitespace(
            shard.charAt(0).toUpperCase() + shard.slice(1),
          );
          this.accounts.push({
            type: 'generated',
            path: i,
            name: 'Account ' + i,
            addr: Account.addr,
            shard: readableShard,
            coinType: this.bip44Code,
          });

          shardsToFind[context[0].value].found = true;
          shardsToFind[context[0].value].index = i;
          found = true;
          for (const shard in shardsToFind) {
            if (shardsToFind[shard].found === false) {
              found = false;
            }
          }
        }
      }
      i++;
    }
    await snap.request({
      method: 'snap_manageState',
      params: {
        operation: 'update',
        newState: {
          currentAccountId: this.currentAccountId,
          accounts: this.accounts,
        },
      },
    });
    return { currentAccountId: address, accounts: this.accounts };
  }

  async getCurrentAccount() {
    if (!this.loaded) {
      await this.load();
    }
    return this.currentAccount;
  }

  async setCurrentAccount(addr) {
    if (!this.loaded) {
      await this.load();
    }
    for (let i = 0; i < this.accounts.length; i++) {
      if (this.accounts[i].addr === addr) {
        this.currentAccountId = addr;
        await snap.request({
          method: 'snap_manageState',
          params: {
            operation: 'update',
            newState: {
              currentAccountId: this.currentAccountId,
              accounts: this.accounts,
            },
          },
        });
        return { currentAccountId: addr, accounts: this.accounts };
      }
    }
    return { error: 'account not found' };
  }

  async getAccounts() {
    if (!this.loaded) {
      await this.load();
    }
    return this.accounts;
  }

  async doesAccountExist(addr) {
    const allAccounts = await this.getAccounts();
    for (const account of allAccounts) {
      if (account.addr === addr) {
        return true;
      }
    }
    return false;
  }

  async createNewAccountByChain(name, chain) {
    if (!this.loaded) {
      await this.load();
    }
    const chains = Object.keys(shardsToFind);
    if (!chains.includes(chain)) {
      return { error: 'chain not found' };
    }
    let i = shardsToFind[chain].index + 1;
    let found = false;
    let Account = null;
    let shardName = null;
    while (!found) {
      Account = await this.generateAccount(i);
      const addr = Account.addr;
      const context = getShardContextForAddress(addr);
      const doesAccountExist = await this.doesAccountExist(addr);
      if (context[0] !== undefined) {
        if (context[0].value === chain && doesAccountExist === false) {
          shardName =
            context[0].value.charAt(0).toUpperCase() +
            context[0].value.slice(1);
          found = true;
          shardsToFind[context[0].value].index = i;
          if (shardsToFind[context[0].value].found === false) {
            shardsToFind[context[0].value].found = true;
          }
          break;
        }
      }
      i++;
    }
    if (!name) {
      name = 'Account ' + i;
    }
    const address = Account.addr;
    this.currentAccountId = address;
    this.currentAccount = Account;
    const addedAccount = {
      type: 'generated',
      path: i,
      name: name,
      addr: address,
      shard: shardName,
      coinType: this.bip44Code,
    };
    this.accounts.push(addedAccount);

    await snap.request({
      method: 'snap_manageState',
      params: {
        operation: 'update',
        newState: {
          currentAccountId: this.currentAccountId,
          accounts: this.accounts,
        },
      },
    });
    return { addedAccount: addedAccount, accounts: this.accounts };
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

  async clearAccounts() {
    const confirm = await this.sendConfirmation(
      'DELETE ALL ACCOUNTS',
      'Are you sure you want to delete all accounts?',
      'After deleting accounts, your accounts and funds cannot be recovered.',
    );
    if (confirm) {
      await snap.request({
        method: 'snap_manageState',
        params: { operation: 'clear' },
      });
      //Go through shards to find and reset
      for (const shard in shardsToFind) {
        shardsToFind[shard].found = false;
        shardsToFind[shard].index = 0;
      }
      return true;
    }
    return false;
  }

  async getPrivateKeyByAddress(address) {
    const confirm = await this.sendConfirmation(
      'SHOW PRIVATE KEY',
      'Are you sure you want to display your private key for this account?',
      'Anyone with this private key can spend your funds',
    );
    if (confirm) {
      // remove whitespace in entered address
      address = address.replace(/\s/g, '');
      // find account
      const account = this.accounts.find((account) => account.addr === address);
      if (!account) {
        throw new Error('Account not found');
      }
      const privateKey = await this.getPrivateKeyByPath(account);
      await this.sendConfirmation(
        'Private Key',
        privateKey,
        `for address ${account.addr}`,
      );
    }
  }

  // getPrivateKeyByPath returns the private key of an account by its path.
  async getPrivateKeyByPath(account) {
    const bip44Node = await snap.request({
      method: 'snap_getBip44Entropy',
      params: {
        coinType: account.coinType,
      },
    });

    const deriver = await getBIP44AddressKeyDeriver(bip44Node);
    const privKey = (await deriver(account.path)).privateKey;
    return privKey;
  }

  // renameAccount renames an account by its address.
  async renameAccount(address, name) {
    // remove whitespace in entered address
    address = address.replace(/\s/g, '');
    // Check if account exists
    let account = this.accounts.find((account) => account.addr === address);
    if (!account) {
      throw new Error('Account not found');
    }

    // Update in place
    this.accounts.map((account) => {
      if (account.addr === address) {
        account.name = name.toString();
      }
      return account;
    });

    // Save to state
    await snap.request({
      method: 'snap_manageState',
      params: {
        operation: 'update',
        newState: {
          currentAccountId: this.currentAccountId,
          accounts: this.accounts,
        },
      },
    });
    return account;
  }
}
