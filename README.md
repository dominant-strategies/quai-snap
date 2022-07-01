# quai-snap

This is a snap for Quai Network which allows for building , and also a GitHub template repository.
For more information on snaps, see [the MetaMask snaps documentation](https://docs.metamask.io/guide/snaps.html#what-is-snaps).

## Running Locally

`yarn install && yarn build:clean && yarn serve`

## Available API Calls

### connect
Call the below function to connect to your wallet. If the user has Matamask Flask installed it also installs the quai-snap automatically.
```javascript
await ethereum.request({
    method: 'wallet_enable',
    params: [{
        wallet_snap: { ['npm:@quainetwork/quai-snap']: {} },
        }]
})
```

### getAccount
Returns user account
```javascript
const response = await ethereum.request({
    method: 'wallet_invokeSnap',
    params: ['npm:@quainetwork/quai-snap', {
            method: 'getAccount'
        }]
})
```

### getAccounts
Returns all of the users accounts on the Quai chain.
```javascript
const response = await ethereum.request({
    method: 'wallet_invokeSnap',
    params: ['npm:@quainetwork/quai-snap', {
            method: 'getAccounts'
        }]
})
```
### getBalance
Returns user's balance. 
```javascript
const response = await ethereum.request({
    method: 'wallet_invokeSnap',
    params: ['npm:@quainetwork/quai-snap', {
            method: 'getBalance'
        }]
})
```
### displayBalance
Displays user balance.
```javascript
const response = await ethereum.request({
    method: 'wallet_invokeSnap',
    params: ['npm:@quainetwork/quai-snap', {
            method: 'displayBalance'
        }]
})
```

### getTransactions
Returns all transactions.
```javascript
const response = await ethereum.request({
    method: 'wallet_invokeSnap',
    params: ['npm:@quainetwork/quai-snap', {
            method: 'getTransactions'
        }]
})
```

### clearAccounts
Returns true if user accounts have been cleared.
```javascript
const response = await ethereum.request({
    method: 'wallet_invokeSnap',
    params: ['npm:@quainetwork/quai-snap', {
            method: 'clearAccounts'
        }]
})
```

### getAddress
Returns account address
```javascript
const response = await ethereum.request({
    method: 'wallet_invokeSnap',
    params: ['npm:@quainetwork/quai-snap', {
            method: 'getAddress'
        }]
})
```

### transfer
Transfers Quai to a destination address
```javascript
const response = await ethereum.request({
    method: 'wallet_invokeSnap',
    params: ['npm:@quainetwork/quai-snap', {
            method: 'transfer',
            to: address,
            amount: 1000
        }]
})
```

### displayMnemonic
Displays the mnemonic phrase
```javascript
const response = await ethereum.request({
    method: 'wallet_invokeSnap',
    params: ['npm:@quainetwork/quai-snap', {
            method: 'displayMnemonic'
        }]
})
```

### createAccount
```javascript
const response = await ethereum.request({
    method: 'wallet_invokeSnap',
    params: ['npm:@quainetwork/quai-snap', {
            method: 'createAccount',
            name: NAME,
            chain: 'Cyprus'
        }]
})
```
### createAccountByChain
```javascript
const responce = await ethereum.request({
    method: 'wallet_invokeSnap',
    params: []
})
```

### generateAllAccounts
```javascript
const response = await ethereum.request({
    method: 'wallet_invokeSnap',
    params: ['npm:@quainetwork/quai-snap', {
            method: 'generateAllAccounts'
        }]
})
```

### generateNumAccounts
Generates N number of accounts
```javascript
const response = await ethereum.request({
    method: 'wallet_invokeSnap',
    params: ['npm:@quainetwork/quai-snap', {
            method: 'generateNumAccounts',
            amount: N
        }]
})
```

### setCurrentAccount
Sets the current account to the specified address
```javascript
const response = await ethereum.request({
    method: 'wallet_invokeSnap',
    params: ['npm:@quainetwork/quai-snap', {
            method: 'setCurrentAccount',
            address: address
        }]
})
```

### getBlockHeight
Returns current block height
```javascript
const response = await ethereum.request({
    method: 'wallet_invokeSnap',
    params: ['npm:@quainetwork/quai-snap', {
            method: 'getBlockHeight'
        }]
})
```

### signData
Prompt user to sign given data, returns signature hash
```javascript
const response = await ethereum.request({
        method: 'wallet_invokeSnap',
        params: ['npm:@quainetwork/quai-snap', {
            method: 'signData',
            data: new Uint8Array()
        }]
})
```