import { getBIP44AddressKeyDeriver } from '@metamask/key-tree';
const ethers = require('ethers');

import { getShardFromAddress, shardsToFind } from './constants';

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

    if (storedAccounts === null || Object.keys(storedAccounts).length === 0) {
      this.loaded = true;
      return {
        currentAccountId: this.currentAccountId,
        accounts: this.accounts,
      };
    } else {
      this.accounts = storedAccounts.accounts;
      if (storedAccounts.currentAccountId == null) {
        this.currentAccount = this.accounts[this.accounts.length - 1];
      } else {
        for (let i = 0; i < storedAccounts.accounts.length; i++) {
          if (
            storedAccounts.accounts[i].addr == storedAccounts.currentAccountId
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

  async getCurrentAccount() {
    if (!this.loaded) {
      await this.load();
    }
    if (this.currentAccount == null) {
      null;
    }
    return this.currentAccount;
  }

  async setCurrentAccount(addr) {
    if (!this.loaded) {
      await this.load();
    }
    for (var i = 0; i < this.accounts.length; i++) {
      if (this.accounts[i].addr == addr) {
        this.currentAccountId = addr;
        await this.wallet.request({
          method: 'snap_manageState',
          params: [
            'update',
            { currentAccountId: addr, accounts: this.accounts },
          ],
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
    console.log(this.accounts)
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
    let path = oldPath + 1;
    if (name == undefined || name == '') {
      name = 'Account ' + path;
    }
    const Account = await this.generateAccount(path);
    const address = Account.addr;
    let context = getShardFromAddress(address);
    while (context == undefined || context == null || context.length === 0) {
      const Account = await this.generateAccount(path + 1);
      const address = Account.addr;
      context = getShardFromAddress(address);
      path++;
    }
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
        { currentAccountId: this.currentAccountId, accounts: this.accounts },
      ],
    });
    return { currentAccountId: address, accounts: this.accounts };
  }

  //Checks if the account has already been generated
  async doesAccountExist(addr) {
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
    const chains = Object.keys(shardsToFind);
    if (!chains.includes(chain)) {
      return { error: 'chain not found' };
    }
    var oldPath = 0;
    if (this.accounts.length > 0)
      oldPath = this.accounts[this.accounts.length - 1].path;

    let i = 1;
    let found = false;
    let Account = null;
    let shardName = null;
    while (!found) {
      Account = await this.generateAccount(oldPath + i);
      let addr = Account.addr;
      let context = getShardFromAddress(addr);
      if (context[0] != undefined) {
        if (
          context[0].value === chain &&
          !(await this.doesAccountExist(addr))
        ) {
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

    await this.wallet.request({
      method: 'snap_manageState',
      params: [
        'update',
        { currentAccountId: this.currentAccountId, accounts: this.accounts },
      ],
    });
    return { currentAccountId: address, accounts: this.accounts };
  }

  async checkShardsToFind(shardsToFind) {
    for (const [key, value] of Object.entries(shardsToFind)) {
      if (value[0] == false) {
        return true;
      }
    }
    return false;
  }

  // Creates all accounts that span the Quai Network shards.
  async generateAllAccounts() {
    let i = 0;
    let foundShard = 0;
    let found = false;
    let Account = null;
    let address = null;
    while (!found && (await this.checkShardsToFind(shardsToFind))) {
      Account = await this.generateAccount(i);
      if (Account.addr != null) {
        address = Account.addr;

        let context = getShardFromAddress(address);
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
            if (value[0] == false) {
              found = false;
            }
          }
        }
      }
      i++;
    }

    await this.wallet.request({
      method: 'snap_manageState',
      params: [
        'update',
        { currentAccountId: this.currentAccountId, accounts: this.accounts },
      ],
    });
    return { currentAccountId: address, accounts: this.accounts };
  }
  // Creates accounts for an amount of paths.
  async generateNumAccounts(amount) {
    if (!this.loaded) {
      await this.load();
    }
    let oldPath = 0;
    if (this.accounts.length != 0) {
      oldPath = this.accounts[this.accounts.length - 1].path;
    }

    var i = 0;
    while (i < amount) {
      const name = 'Account ' + (oldPath + 1);
      const Account = await this.generateAccount(oldPath + 1);
      const address = Account.addr;
      let context = getShardFromAddress(address);
      if (context[0] != undefined) {
        let shard = context[0].value;
        let readableShard = shard.charAt(0).toUpperCase() + shard.slice(1);
        const path = oldPath + 1;
        this.currentAccount = Account;
        this.currentAccountId = address;
        this.accounts.push({
          type: 'generated',
          path: path,
          name: name,
          addr: address,
          shard: readableShard,
        });
        i++;
      }
      oldPath++;
    }

    await this.wallet.request({
      method: 'snap_manageState',
      params: [
        'update',
        { currentAccountId: this.currentAccountId, accounts: this.accounts },
      ],
    });
    return { currentAccountId: this.currentAccountId, accounts: this.accounts };
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
