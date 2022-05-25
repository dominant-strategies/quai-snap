import {
  getBIP44AddressKeyDeriver,
  deriveBIP44AddressKey,
} from '@metamask/key-tree';
const ethers = require('ethers');

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

    if (storedAccounts === null || Object.keys(storedAccounts).length === 0) {
      console.log('no accounts found');
      const Account = await this.generateAccount(0);
      let extendedAccount = {};
      extendedAccount.type = 'generated';
      extendedAccount.addr = Account.addr;
      extendedAccount.path = 1;
      extendedAccount.name = 'Account 1';
      const address = Account.addr;
      const accounts = {};
      accounts[address] = extendedAccount;
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

    const Account = await this.generateAccount(oldPath + 1);
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

  // generateAccount creates a new account with a given path.
  async generateAccount(path) {
    const bip44Code = '60';
    const bip44Node = await this.wallet.request({
      method: `snap_getBip44Entropy_${bip44Code}`,
      params: [],
    });

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
