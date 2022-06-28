# quai-snap

This is a snap for Quai Network which allows for building , and also a GitHub template repository.
For more information on snaps, see [the MetaMask snaps documentation](https://docs.metamask.io/guide/snaps.html#what-is-snaps).

## Running Locally

`yarn install && yarn build:clean && yarn serve`

## Available API Calls

### connect
Call the below function to connect to your wallet. If the user has Matamask Flask installed it also installs the quai-snap automatically.
```javascript
async function connect () {
    await ethereum.request({
        method: 'wallet_enable',
        params: [{
          wallet_snap: { ['npm:@quainetwork/quai-snap']: {} },
        }]
    })
}
``` 
### getAccounts
Generates accounts for all 13 Quai chains according to the following [structure](https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki)
```javascript
async function getAccounts () {
    const response = await ethereum.request({
        method: 'wallet_invokeSnap',
        params: ['npm:@quainetwork/quai-snap', {
            method: 'getAccounts'
        }]
    })
}
```

