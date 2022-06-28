# quai-snap

This is a snap for Quai Network which allows for building , and also a GitHub template repository.
For more information on snaps, see [the MetaMask snaps documentation](https://docs.metamask.io/guide/snaps.html#what-is-snaps).

## Running Locally

`yarn install && yarn build:clean && yarn serve`

## Available API Calls

### Connect
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

