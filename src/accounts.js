import { getBIP44AddressKeyDeriver, SLIP10Node } from '@metamask/key-tree';
const ethers = require('ethers');

import { GetShardFromAddress } from './constants';

let shardsToFind = {
  prime: [false, 1],
  cyprus: [false, 2],
  paxos: [false, 3],
  hydra: [false, 4],
  'cyprus-1': [false, 5],
  'cyprus-2': [false, 6],
  'cyprus-3': [false, 7],
  'paxos-1': [false, 8],
  'paxos-2': [false, 9],
  'paxos-3': [false, 10],
  'hydra-1': [false, 11],
  'hydra-2': [false, 12],
  'hydra-3': [false, 13],
};

export default class Accounts {
  constructor(wallet) {
    this.wallet = wallet;
    this.accounts = [];
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
      //const accounts = await this.generateZoneAccount();
      this.loaded = true;
      console.log('setting this.accounts');
      console.log(this.accounts);
      return {
        currentAccountId: this.currentAccountId,
        Accounts: this.accounts,
      };
    } else {
      console.log('have stored accounts');
      console.log(storedAccounts);
      this.accounts = storedAccounts.Accounts;
      if (storedAccounts.currentAccountId == null) {
        this.currentAccount =
          this.accounts[this.accounts.length - 1];
      } else {
        for (let i = 0; i < storedAccounts.Accounts.length; i++) {
          if (storedAccounts.Accounts[i].addr == storedAccounts.currentAccountId) {
            this.currentAccount = storedAccounts.Accounts[i];
          }
        }
      }
      this.currentAccountId = this.currentAccount.addr;
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
    console.log('getCurrentAccount', this.currentAccount);
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
      console.log('this.currentAccount', addr, this.currentAccount);
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
    console.log('Getting accounts');
    if (!this.loaded) {
      await this.load();
    }
    console.log(this.accounts);
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
    for (const [key, value] of Object.entries(shardsToFind)) {
      value[0] = false;
      console.log(`${key}: ${value}`);
    }
    return true;
  }
  // createAccount creates a new account with a given name.
  async createNewAccount(name) {
    if (!this.loaded) {
      await this.load();
    }

    //If there is an account with such a name, return an error
    const oldPath = this.accounts.length;
    for (let i = 0; i < this.accounts.length; i++) {
      if (this.accounts[i].name == name) {
        return { error: 'account name already exists' };
      }
    }

    if (name == undefined || name == '') {
      name = 'Account ' + (oldPath + 1);
    }
    const Account = await this.generateAccount(oldPath + 1);
    const address = Account.addr;
    const path = oldPath + 1;
    let context = GetShardFromAddress(address);
    console.log('context: ', context);
    let shard = context[0].value;
    let readableShard = shard.charAt(0).toUpperCase() + shard.slice(1);
    this.accounts.push({
      type: 'generated',
      path: path,
      name: name,
      addr: address,
      shard: readableShard,
    });

    await this.wallet.request({
      method: 'snap_manageState',
      params: [
        'update',
        { currentAccountId: this.currentAccountId, Accounts: this.accounts },
      ],
    });
    return { currentAccountId: address, Accounts: this.accounts };
  }

  //Checks if the account has already been generated
  async accPresent(addr) {
    let allAccounts = await this.getAccounts();
    for (const address of allAccounts) {
      let addrHash = Object.keys(address)[0];
      if (addrHash == addr) {
        return true;
      }
    }
    return false;
  }

  // Chain is an indexable value into QUAI_CONTEXTS i.e prime, paxos, cyprus-1.
  async createNewAccountByChain(name, chain) {
    if (!this.loaded) {
      await this.load();
    }

    const oldPath = this.accounts.length;
    let i = 1;
    let found = false;
    let Account = null;
    let shardName = null;
    while (!found) {
      Account = await this.generateAccount(oldPath + i);
      let addr = Account.addr;

      let context = GetShardFromAddress(addr);
      if (context[0] != undefined) {
        if (context[0].value === chain && !(await this.accPresent(addr))) {
          shardName =
            context[0].value.charAt(0).toUpperCase() +
            context[0].value.slice(1);
          found = true;
          break;
        }
      }
      i++;
    }
    const path = oldPath + i;
    if (!name) {
      name = 'Account ' + path;
    }
    console.log('Account: ' + Account);
    const address = Account.addr;
    this.currentAccountId = address;
    this.currentAccount = Account;
    this.accounts.push({
      type: 'generated',
      path: path,
      name: name,
      addr: address,
      shard: shardName,
    });
    //console.log("THIS ACCOUNT")
    //console.log(this.accounts[address])
    await this.wallet.request({
      method: 'snap_manageState',
      params: [
        'update',
        { currentAccountId: this.currentAccountId, Accounts: this.accounts },
      ],
    });
    return { currentAccountId: address, Accounts: this.accounts };
  }

  async checkShardsToFind() {
    for (const [key, value] of Object.entries(shardsToFind)) {
      console.log(`${key}: ${value}`);
      if (value[0] == false) {
        return true;
      }
    }
    return false;
  }

  // Creates all accounts that span the Quai Network shards.
  async generateAllAccounts() {
    console.log('accounts length', this.accounts.length);

    let i = 0;
    let foundShard = 0;
    let found = false;
    let Account = null;
    let address = null;
    while (!found && (await this.checkShardsToFind())) {
      Account = await this.generateAccount(i);

      console.log(Account);
      if (Account.addr != null) {
        address = Account.addr;

        let context = GetShardFromAddress(address);
        // If this address exists in a shard, check to see if we haven't found it yet.
        if (
          context[0] != undefined &&
          shardsToFind[context[0].value][0] == false
        ) {
          this.currentAccount = Account;
          this.currentAccountId = Account.addr;
          let shard = context[0].value;
          let readableShard = shard.charAt(0).toUpperCase() + shard.slice(1);
          this.accounts.push({
            type: 'generated',
            path: i,
            name: 'Account ' + shardsToFind[shard][1],
            addr: Account.addr,
            shard: readableShard,
          });
          foundShard++;

          shardsToFind[context[0].value][0] = true;
          found = true;
          for (const [key, value] of Object.entries(shardsToFind)) {
            console.log(`${key}: ${value}`);
            if (value[0] == false) {
              found = false;
            }
          }
        }
      }
      i++;
    }

    console.log('# of addresses generated:  ', foundShard);

    await this.wallet.request({
      method: 'snap_manageState',
      params: [
        'update',
        { currentAccountId: this.currentAccountId, Accounts: this.accounts },
      ],
    });
    return { currentAccountId: address, Accounts: this.accounts };
  }
  // Creates accounts for an amount of paths.
  async generateNumAccounts(amount) {
    if (!this.loaded) {
      await this.load();
    }
    let oldPath = 0;
    if (this.accounts.length != 0) {
      oldPath =
        this.accounts[
          Object.keys(this.accounts)[Object.keys(this.accounts).length - 1]
        ].path;
    }

    console.log('accounts length', oldPath);
    for (var i = 0; i < amount; i++) {
      const name = 'Account ' + (oldPath + 1);
      const Account = await this.generateAccount(oldPath + 1);
      const address = Account.addr;
      console.log(address);
      const path = oldPath + 1;
      this.currentAccount = Account;
      this.currentAccountId = address;
      this.accounts.push({
        type: 'generated',
        path: path,
        name: name,
        addr: address,
      });
      oldPath++;
    }

    await this.wallet.request({
      method: 'snap_manageState',
      params: [
        'update',
        { currentAccountId: this.currentAccountId, Accounts: this.accounts },
      ],
    });
    return { currentAccountId: this.currentAccountId, Accounts: this.accounts };
  }
  // Creates all accounts that span the Quai Network shards.
  async generateZoneAccount() {
    console.log('accounts length', this.accounts.length);

    let i = 0;
    let foundShard = 0;
    let found = false;
    let Account = null;
    let address = null;
    while (!found) {
      Account = await this.generateAccount(i);
      if (Account.addr != null) {
        address = Account.addr;

        let context = GetShardFromAddress(address);
        // If this address exists in a shard, check to see if we haven't found it yet.
        if (
          context[0] != undefined &&
          shardsToFind[context[0].value][0] === false
        ) {
          foundShard++;
          this.currentAccount = Account;
          this.currentAccountId = Account.addr;
          let shard = context[0].value;
          let readableShard = shard.charAt(0).toUpperCase() + shard.slice(1);
          this.accounts.push({
            type: 'generated',
            path: i,
            name: 'Account ' + (foundShard + 1),
            addr: Account.addr,
            shard: readableShard,
          });
          break;
        }
      }
      i++;
    }

    console.log('# of addresses generated:  ', foundShard);

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
    const bip44Code = 994;
    const bip44Node = await this.wallet.request({
      method: `snap_getBip44Entropy`,
      params: {
        coinType: bip44Code,
      },
    });

    // m/purpose'/bip44Code'/accountIndex'/change/addressIndex
    // metamask has supplied us with entropy for "m/purpose'/bip44Code'/"
    // we need to derive the final "accountIndex'/change/addressIndex"
    const deriver = await getBIP44AddressKeyDeriver(bip44Node);

    const Account = {};
    const key = await this.toHexString((await deriver(path)).publicKeyBuffer);
    Account.addr = ethers.utils.computeAddress(key);
    Account.path = path;

    console.log('Generating account...' + key);
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
