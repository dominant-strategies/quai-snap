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