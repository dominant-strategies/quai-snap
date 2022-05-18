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
    console.log('load function called');
    const storedAccounts = await this.wallet.request({
      method: 'snap_manageState',
      params: ['get'],
    });

    if (storedAccounts === null || Object.keys(storedAccounts).length === 0) {
      const Account = await this.generateAccount(1);
      let extendedAccount = {};
      extendedAccount.type = 'generated';
      extendedAccount.addr = Account.addr;
      extendedAccount.path = 2;
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

      return { currentAccountId: address, Accounts: accounts };
    } else {
      this.accounts = storedAccounts.Accounts;
      this.currentAccountId = storedAccounts.currentAccountId;
      this.loaded = true;
      console.log('storedAccounts');
      console.log(storedAccounts);
      return storedAccounts;
    }
  }

  async unlockAccount(addr) {
    if (!this.loaded) {
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
    if (!name) {
      name = 'Account ' + (Object.keys(this.accounts).length + 1);
    }

    const Account = await this.generateAccount(this.accounts.length + 2);
    const address = Account.addr;
    const path = this.accounts.length + 2;
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
    const derivationPath = "m/44'/3'/0'/0/" + path;
    const [, , coinType, account, change, addressIndex] =
      derivationPath.split('/');
    const bip44Code = coinType.replace("'", '');
    const isMainnet = bip44Code === '3';
    const bip44Node = await this.wallet.request({
      method: `snap_getBip44Entropy_${bip44Code}`,
      params: [],
    });

    // metamask has supplied us with entropy for "m/purpose'/bip44Code'/"
    // we need to derive the final "accountIndex'/change/addressIndex"
    console.log('bip44Node');
    console.log(bip44Node);
    bip44Node.publicKey = bip44Node.ke;
    const extendedPrivateKey = deriveBIP44AddressKey(bip44Node, {
      account: parseInt(account),
      address_index: parseInt(addressIndex),
      change: parseInt(change),
    });
    console.log('extendedPrivateKey');
    console.log(extendedPrivateKey);
    const privateKey = extendedPrivateKey.slice(0, 32);
    console.log('extendedPrivateKey');
    const extendedKey = keyRecover(privateKey, !isMainnet);

    const Account = {
      address: extendedKey.address,
      privateKey: extendedKey.private_base64,
      publicKey: extendedKey.public_hexstring,
    };

    console.log(Account);
    return Account;
  }
}
