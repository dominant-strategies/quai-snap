# quai-snap

This is an **EXPERIMENTAL** snap for Quai Network.

## Running Locally

`yarn install`
`yarn build:clean && yarn serve`

## Running Tests

`yarn test`
`yarn test:coverage`

## Available API Calls

### connect

Call the below function to connect to your snap. If the user has Matamask Flask installed it also installs the quai-snap automatically.

```javascript
await ethereum.request({
  method: 'wallet_enable',
  params: [
    {
      wallet_snap: { ['npm:@quainetwork/quai-snap']: {} },
    },
  ],
});
```

### getCurrentAccount

Returns user account

```javascript
const response = await ethereum.request({
    method: 'wallet_invokeSnap',
    params: { snapId: snapId, request: { method: 'getCurrentAccount' } },
});
```

### setCurrentAccount

Returns user account

```javascript
const response = await ethereum.request({
  method: 'wallet_invokeSnap',
  params: [
    'npm:@quainetwork/quai-snap',
    {
      method: 'setCurrentAccount',
      address: '0x123.....',
    },
  ],
});
```

### getAccounts

Returns all of the users accounts on the Quai chain.

```javascript
const response = await ethereum.request({
    method: 'wallet_invokeSnap',
    params: { snapId: snapId, request: { method: 'getAccounts' } },
});
```

### clearAccounts

Returns true if user accounts have been cleared.

```javascript
const response = await ethereum.request({
    method: 'wallet_invokeSnap',
    params: { snapId: snapId, request: { method: 'clearAccounts' } },
});
```

### renameAccount

Renames a user account by address

```javascript
const response = await ethereum.request({
        method: 'wallet_invokeSnap',
        params: {
        snapId: snapId,
        request: {
            method: 'renameAccount',
            params: { address: address, name: newName },
            network: "local"
        },
    },
});
```

### sendTransaction

Sends a Quai Transaction

```javascript
const response = await ethereum.request({
        method: 'wallet_invokeSnap',
        params: {
        snapId: snapId,
        request: {
            method: 'sendTransaction',
            params: {
                toAddress: to,
                value: value,
                network: "local"
            },
        },
    },
});
```

### getPrivKeyByAddress

Returns the private key for a given address

```javascript
const response = await ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
    snapId: snapId,
    request: {
        method: 'getPrivateKeyByAddress',
        params: {
            address: document.querySelector('#privateKeyAddress').value,
        },
    },
    },
});
```

### createAccountByChain

```javascript
const response = await ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
    snapId: snapId,
    request: {
        method: 'createAccountByChain',
        params: {
        name: document.querySelector('#accountName').value,
        chain: document.getElementById('createByChain').value,
        network: "local"
        },
    },
    },
});
```

### generateAllAccounts

```javascript
const response = await ethereum.request({
  method: 'wallet_invokeSnap',
  params: [
    'npm:@quainetwork/quai-snap',
    {
      method: 'generateAllAccounts',
    },
  ],
});
```

### setCurrentAccount

Sets the current account to the specified address

```javascript
const response = await ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
    snapId: snapId,
    request: {
        method: 'setCurrentAccount',
        params: {
            address: address,
            network: "local"
        },
    },
    },
});
```

### signData

Prompt user to sign given data, returns signature hash

```javascript
const response = await ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
    snapId: snapId,
    request: {
        method: 'signData',
        params: {
            data: document.querySelector('#signMessage').value,
        },
    },
    },
});
```