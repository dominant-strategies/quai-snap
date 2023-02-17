import { getBIP44AddressKeyDeriver } from '@metamask/key-tree';

export const mockAccountsObj = {
  '0x0940f153016623DbD240168DED3b758fC6d04a90:': {
    addr: '0x0940f153016623DbD240168DED3b758fC6d04a90',
    name: 'Account 1',
    path: 85,
    shard: 'Prime',
    type: 'generated',
  },
  '0x1105574B16E055613963348AE0c7346174837519:': {
    addr: '0x1105574B16E055613963348AE0c7346174837519',
    name: 'Account 2',
    path: 86,
    shard: 'Cyprus',
    type: 'generated',
  },
  '0x1740f153016623DbD240168DED3b758fC6d04a89:': {
    addr: '0x1740f153016623DbD240168DED3b758fC6d04a89',
    name: 'Account 3',
    path: 87,
    shard: 'Cyprus-1',
    type: 'generated',
  },
  '0x23cbe7E7c4f744f774d06CbCFb3d1A59bc4035f6:': {
    addr: '0x23cbe7E7c4f744f774d06CbCFb3d1A59bc4035f6',
    name: 'Account 4',
    path: 88,
    shard: 'Cyprus-2',
    type: 'generated',
  },
  '0x2805C79f4590C8dbc573C746aF221F18A9e0dCa4:': {
    addr: '0x2805C79f4590C8dbc573C746aF221F18A9e0dCa4',
    name: 'Account 5',
    path: 89,
    shard: 'Cyprus-3',
    type: 'generated',
  },
  '0x3324FA2e6698BA947487f1289c670296399811D2:': {
    addr: '0x3324FA2e6698BA947487f1289c670296399811D2',
    name: 'Account 6',
    path: 90,
    shard: 'Paxos',
    type: 'generated',
  },
  '0x410EfeA0FFC0Eee45405853e3ee1d9b275d9388e:': {
    addr: '0x410EfeA0FFC0Eee45405853e3ee1d9b275d9388e',
    name: 'Account 7',
    path: 91,
    shard: 'Paxos-1',
    type: 'generated',
  },
  '0x476570C8557d6eB6bfbc9d9157aB240Dc7b10969:': {
    addr: '0x476570C8557d6eB6bfbc9d9157aB240Dc7b10969',
    name: 'Account 8',
    path: 92,
    shard: 'Paxos-2',
    type: 'generated',
  },
  '0x55b05287A8c51d319FAa12D918AF720031Ef9d4f:': {
    addr: '0x55b05287A8c51d319FAa12D918AF720031Ef9d4f',
    name: 'Account 9',
    path: 93,
    shard: 'Paxos-3',
    type: 'generated',
  },
  '0x611E6614BA36ba23B70227D11704C91851106745:': {
    addr: '0x611E6614BA36ba23B70227D11704C91851106745',
    name: 'Account 10',
    path: 94,
    shard: 'Hydra',
    type: 'generated',
  },
  '0x65c9547FAe61987E77cb36572bfA4Fb91157d3E1': {
    addr: '0x65c9547FAe61987E77cb36572bfA4Fb91157d3E1',
    name: 'Account 11',
    path: 95,
    shard: 'Hydra-1',
    type: 'generated',
  },
  '0x7321234Ec8916db7D03AeBF88f99a38769304968': {
    addr: '0x7321234Ec8916db7D03AeBF88f99a38769304968',
    name: 'Account 12',
    path: 96,
    shard: 'Hydra-2',
    type: 'generated',
  },
  '0x799ef963f0ABeF7cc01556A816193C4B0469D336': {
    addr: '0x799ef963f0ABeF7cc01556A816193C4B0469D336',
    name: 'Account 13',
    path: 97,
    shard: 'Hydra-3',
    type: 'generated',
  },
  '0x146F08a82299B7958a25a77A5cb6FD2Aec7c355D': {
    addr: '0x146F08a82299B7958a25a77A5cb6FD2Aec7c355D',
    name: 'Account 33',
    path: 33,
    shard: 'Cyprus-1',
    type: 'generated',
    mnemonic:
      'make jump junk secret once leisure rather pioneer solar invest mixed nice level false predict horror bleak answer unit half file curious arrow abstract letter',
  },
};

export const mockAccountsArray = Object.values(mockAccountsObj);

// derived from the seed phrase:
// 'sand reason sound giraffe enrich chair gauge patrol lunch behind skull tennis dinosaur roof burden carry devote alley cage bulb cotton observe relax about cupboard
export const bip44Entropy = {
  depth: 2,
  masterFingerprint: 3604421617,
  parentFingerprint: 801743947,
  index: 2147484642,
  privateKey:
    '40b6d8fc5aabb05b12f734eeef041bb1a37be6be5ff459e0cec1e98d594cbc0b',
  publicKey:
    '04b6e78a5eff4f19f0733ae61791b780a8746d01d0511e91ca2013e0dff11f88d76020f1d1ce7a9a06e5d6f06d10ff31d05898daea4b0116e8e776fb2488c5891b',
  chainCode: '4aeaeaceaba4ca7ed413367ac8af2340b40bd7b48e2ff72a2e44c0d34ab93f2b',
  coin_type: 994,
  path: "m / bip32:44' / bip32:994'",
};

export const getBip44EntropyStub = async (...args) => {
  let _a;
  if (
    ((_a = args === null || args === void 0 ? void 0 : args[0]) === null ||
    _a === void 0
      ? void 0
      : _a.coinType) === 994
  ) {
    return bip44Entropy;
  } else {
    return null;
  }
};

export async function getAddressKeyDeriver(wallet) {
  const bip44Code = 994;
  const bip44Node = await snap.request({
    method: 'snap_getBip44Entropy',
    params: {
      coinType: bip44Code,
    },
  });
  return getBIP44AddressKeyDeriver(bip44Node);
}

export const testShardsToFind = {
  prime: [true, 1],
  cyprus: [false, 2],
  paxos: [false, 3],
  hydra: [true, 4],
  'cyprus-1': [false, 5],
  'cyprus-2': [false, 6],
  'cyprus-3': [false, 7],
  'paxos-1': [false, 8],
  'paxos-2': [false, 9],
  'paxos-3': [false, 10],
  'hydra-1': [false, 11],
  'hydra-2': [true, 12],
  'hydra-3': [false, 13],
};
