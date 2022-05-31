import {
  getBIP44AddressKeyDeriver,
  deriveBIP44AddressKey,
} from '@metamask/key-tree';
const ethers = require('ethers');

import { QUAI_CONTEXTS } from './constants';

/*
 * The `wallet` API is a superset of the standard provider,
 * and can be used to initialize an ethers.js provider like this:
 */
const provider = new ethers.providers.Web3Provider(wallet);

export default class Accounts {
  constructor(wallet) {
    this.wallet = wallet;
    this.accounts = {};
    this.currentAccountId = null;
    this.currentAccount = null;
    this.loaded = false;
  }

  async load() {
    //load acount Data
    const storedAccounts = await this.wallet.request({
      method: 'snap_manageState',
      params: ['get'],
    });

    console.log('Stored accounts');
    console.log(storedAccounts);

    if (storedAccounts === null || Object.keys(storedAccounts).length === 0) {
      console.log('no accounts found');
      const accounts = await this.generateAllAccounts();
      const address = accounts[accounts.length - 1].addr;
      await this.wallet.request({
        method: 'snap_manageState',
        params: ['update', { currentAccountId: address, Accounts: accounts }],
      });
      this.currentAccountId = address;
      this.accounts = accounts;
      this.loaded = true;
      console.log('setting this.accounts');
      console.log(this.accounts);
      return { currentAccountId: address, Accounts: accounts };
    } else {
      console.log('have stored accounts');
      this.accounts = storedAccounts.Accounts;
      this.currentAccountId = storedAccounts.currentAccountId;
      this.loaded = true;

      return storedAccounts;
    }
  }

  async unlockAccount(addr) {
    if (!this.loaded) {
      console.log('not loaded in unlock account');
      await this.load();
    }
    if (this.accounts.hasOwnProperty(addr)) {
      const tempAccount = this.accounts[addr];
      if (tempAccount.type === 'generated') {
        const Account = await this.generateAccount(tempAccount.path);

        return Account;
      }
    }
  }

  async getCurrentAccount() {
    if (!this.loaded) {
      await this.load();
    }
    if (this.currentAccount !== null) {
      return this.currentAccount;
    }
    this.currentAccount = await this.unlockAccount(this.currentAccountId);
    return this.currentAccount;
  }

  async setCurrentAccount(addr) {
    if (!this.loaded) {
      await this.load();
    }
    if (this.accounts.hasOwnProperty(addr)) {
      this.currentAccountId = addr;
      this.currentAccount = await this.unlockAccount(addr);
      await this.wallet.request({
        method: 'snap_manageState',
        params: ['update', { currentAccountId: addr, Accounts: this.accounts }],
      });
      return { currentAccountId: addr, Accounts: this.accounts };
    } else {
      return { error: 'account not found' };
    }
  }

  async getAccounts() {
    if (!this.loaded) {
      await this.load();
    }

    return this.accounts;
  }
  async clearAccounts() {
    await this.wallet.request({
      method: 'snap_manageState',
      params: ['update', {}],
    });
    const state = await this.wallet.request({
      method: 'snap_manageState',
      params: ['get'],
    });

    return true;
  }
  // createAccount creates a new account with a given name.
  async createNewAccount(name) {
    if (!this.loaded) {
      await this.load();
    }

    const oldPath = Object.keys(this.accounts).length;

    if (!name) {
      name = 'Account ' + (oldPath + 1);
    }

    console.log('accounts length', oldPath);

    for (let i = 0; i < 1000; i++) {
      const Account = await this.generateAccount(i + 1);
    }
    // const Account = await this.generateAccount(oldPath + 1);
    const address = Account.addr;
    const path = oldPath + 1;
    this.accounts[address] = { type: 'generated', path: path, name: name };
    await this.wallet.request({
      method: 'snap_manageState',
      params: [
        'update',
        { currentAccountId: this.currentAccountId, Accounts: this.accounts },
      ],
    });
    return { currentAccountId: address, Accounts: this.accounts };
  }
  // Chain is an indexable value into QUAI_CONTEXTS i.e prime, paxos, cyprus-1.
  async createNewAccountByChain(name, chain) {
    if (!this.loaded) {
      await this.load();
    }

    const oldPath = Object.keys(this.accounts).length;

    if (!name) {
      name = 'Account ' + (oldPath + 1);
    }

    console.log('accounts length', oldPath);

    let i = 0;
    let found = false;
    let Account = null;
    while (!found) {
      Account = await this.generateAccount(i + 1);
      let addr = Account.addr;

      let context = QUAI_CONTEXTS.filter((obj) => {
        let num = parseInt(Number('0x' + addr.substring(2, 4)), 10);
        let start = parseInt(Number('0x' + obj.byte[0]), 10);
        let end = parseInt(Number('0x' + obj.byte[1]), 10);
        return num >= start && num <= end;
      });
      if (context[0].value === chain) {
        found = true;
        break;
      }
    }

    const address = Account.addr;
    const path = oldPath + 1;
    this.accounts[address] = { type: 'generated', path: path, name: name };
    await this.wallet.request({
      method: 'snap_manageState',
      params: [
        'update',
        { currentAccountId: this.currentAccountId, Accounts: this.accounts },
      ],
    });
    return { currentAccountId: address, Accounts: this.accounts };
  }

  // Creates all accounts that span the Quai Network shards.
  async generateAllAccounts() {
    console.log('accounts length', this.accounts.length);

    let shardsToFind = {
      prime: false,
      cyprus: false,
      'cyprus-1': false,
      'cyprus-2': false,
      'cyprus-3': false,
      paxos: false,
      'paxos-1': false,
      'paxos-2': false,
      'paxos-3': false,
      hydra: false,
      'hydra-1': false,
      'hydra-2': false,
      'hydra-3': false,
    };

    let i = 0;
    let found = false;
    let Account = null;
    let address = null;
    while (!found) {
      Account = await this.generateAccount(i + 1);
      address = Account.addr;
      this.accounts[address] = {
        type: 'generated',
        path: i,
        name: 'Account' + (i + 1),
      };

      let context = QUAI_CONTEXTS.filter((obj) => {
        let num = parseInt(Number('0x' + address.substring(2, 4)), 10);
        let start = parseInt(Number('0x' + obj.byte[0]), 10);
        let end = parseInt(Number('0x' + obj.byte[1]), 10);
        return num >= start && num <= end;
      });
      if (context[0] != undefined) {
        shardsToFind[context[0].value] = true;
        found = true;
        for (const [key, value] of Object.entries(shardsToFind)) {
          console.log(`${key}: ${value}`);
          if (value == false) {
            found = false;
          }
        }
      }
      i++;
    }

    await this.wallet.request({
      method: 'snap_manageState',
      params: [
        'update',
        { currentAccountId: this.currentAccountId, Accounts: this.accounts },
      ],
    });
    return { currentAccountId: address, Accounts: this.accounts };
  }

  // generateAccount creates a new account with a given path.
  async generateAccount(path) {
    const bip44Code = '9777';
    const bip44Node = await this.wallet.request({
      method: `snap_getBip44Entropy_${bip44Code}`,
      params: [],
    });

    // m/purpose'/bip44Code'/accountIndex'/change/addressIndex
    // metamask has supplied us with entropy for "m/purpose'/bip44Code'/"
    // we need to derive the final "accountIndex'/change/addressIndex"
    const deriver = getBIP44AddressKeyDeriver(bip44Node);

    const Account = {};
    const key = await this.toHexString(deriver(path).slice(0, 32));
    Account.addr = ethers.utils.computeAddress(key);

    console.log(Account);
    return Account;
  }

  async toHexString(byteArray) {
    var s = '0x';
    byteArray.forEach(function (byte) {
      s += ('0' + (byte & 0xff).toString(16)).slice(-2);
    });
    return s;
  }
}
