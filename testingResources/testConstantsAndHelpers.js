import { getBIP44AddressKeyDeriver } from '@metamask/key-tree';

export const mockAccountsObj = {
  '0x035498F58A8095Efa9b01FD6650384a6551C2078': {
    addr: '0x035498F58A8095Efa9b01FD6650384a6551C2078',
    name: 'Account 4',
    path: 4,
    shard: 'Cyprus-1',
    type: 'generated',
    coinType: 1,
  },
  '0x2aB72D26F1E311807bA2Ff31bB378e8CAbF471eb': {
    addr: '0x2aB72D26F1E311807bA2Ff31bB378e8CAbF471eb',
    name: 'Account 28',
    path: 28,
    shard: 'Cyprus-2',
    type: 'generated',
    coinType: 1,
  },
  '0x556973bA84fC89C1BfA1C69d2E327F7E48BDb01E': {
    addr: '0x556973bA84fC89C1BfA1C69d2E327F7E48BDb01E',
    name: 'Account 6',
    path: 6,
    shard: 'Cyprus-3',
    type: 'generated',
    coinType: 1,
  },
  '0x6ae64bf679dc612989E7E0EC672c2fb4468eE08A': {
    addr: '0x6ae64bf679dc612989E7E0EC672c2fb4468eE08A',
    name: 'Account 9',
    path: 9,
    shard: 'Paxos-1',
    type: 'generated',
    coinType: 1,
  },
  '0x868F03f8D06857A45FE4fdA4Fd282fB9FC4EEf99': {
    addr: '0x868F03f8D06857A45FE4fdA4Fd282fB9FC4EEf99',
    name: 'Account 1',
    path: 1,
    shard: 'Paxos-2',
    type: 'generated',
    coinType: 1,
  },
  '0xA8a8eaF2b3f1881527Be737b861c281F18654fB5': {
    addr: '0xA8a8eaF2b3f1881527Be737b861c281F18654fB5',
    name: 'Account 22',
    path: 22,
    shard: 'Paxos-3',
    type: 'generated',
    coinType: 1,
  },
  '0xC7F5c82B94b8B3E03EF1704db0F24DE26077D62a': {
    addr: '0xC7F5c82B94b8B3E03EF1704db0F24DE26077D62a',
    name: 'Account 5',
    path: 5,
    shard: 'Hydra-1',
    type: 'generated',
    coinType: 1,
  },
  '0xCA3B5335A613E044997A0338296b84F48D2e6702': {
    addr: '0xCA3B5335A613E044997A0338296b84F48D2e6702',
    name: 'Account 0',
    path: 0,
    shard: 'Hydra-2',
    type: 'generated',
    coinType: 1,
  },
  '0xe951D38B7f2C51482C4c517A54F89D1547d21346': {
    addr: '0xe951D38B7f2C51482C4c517A54F89D1547d21346',
    name: 'Account 8',
    path: 8,
    shard: 'Hydra-3',
    type: 'generated',
    coinType: 1,
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
  coin_type: 1,
  path: "m / bip32:44' / bip32:994'",
};

export const getBip44EntropyStub = async (...args) => {
  let _a;
  if (
    ((_a = args === null || args === void 0 ? void 0 : args[0]) === null ||
    _a === void 0
      ? void 0
      : _a.coinType) === 1
  ) {
    return bip44Entropy;
  } else {
    return null;
  }
};

export const fakeAddressPubKeys = [
  '0x04f2e98f9084a48c8d21186004bc4e8d771fa3af7baaa9b2dad3f1f42775a6e23ac02130a0aa0cc21b39acb489d910e0de4ffd516451516764aaada8b859808fda',
  '0x0440c811e4249f169c6fcec64ad2d70ef682aa4cd4c4f01ba9b38c1741b5fb81b623b7d237551efbaf9f34a296b973f8ddc1a2ed51fe37bb43e964f5c2fc791b2b',
  '0x044265424dea8017f125745450dcc0a3e79dd51621e7b9a99c606e80fa8441735592584c85909d7cd07aa325366795809dadd043b96974dec6783b618cefe2972c',
  '0x0403a8fe849ca090a1dc0dc7f9726330a9570e25a1922e5dd35ae344f5f818b27e4263f411e33045ab8293b6d14b09a0a7bfe2c7bfcf331a005c3f2b76521bffc9',
  '0x045cf437c94b5792f2f978fa09ce3254fe06fffadf89acf799a2f418d81948a9a10b730801d7c85d5a6140f7eb8a30c264b7d607cd303a8d6b5107b9b0a0be343a',
  '0x0400b860b88016ee717b01bd28f25cf0f800a49baae930471481aaba402e332103fbec95328b386dc56a89e4f01da48dbe01b1744771d71f8e9c9ddc3e8a89750d',
  '0x04e7568bac4f16955265398d53eced03a9afb1f01e363599e832308a1a3d27daea2cd491cb5ea740536aba8b3a06686abe7f9ae2ef36656d770b445f6d907a063d',
  '0x047534b1da4433b486e948646454f3718585a63532b04e376ecec088455a04ac627750b2b12f0918199046097a17763b482483fa714087ed103382b9c7dbfe4690',
  '0x04d527b1f66dede1389668719382b1263508ffeaa55a96172eb6ddd0e53afe078003a5a5ac80605ef1aac5ff1f810b708c1a5db95601dc1566299107b32c56c6cf',
  '0x04c7cc52435d6c093711df7124e77ef47e1fafc52171add4bf0b79044a4b7015f9f5db6ebb7519977fdee70fe680097e4be666734fc2dde8f1ad1ac7a2b5828ccc',
  '0x042b9f347f21707c85895cfb097f0f787a8edf9a5331aac4738f69714d43c5073a38633f98f05d0f8910b99d35670585a055481411a982c70193ec319285df0386',
  '0x04f4081fb0412c0b16460c7ce3b09161b40129a5713e3f7d68dce9256f5f072c7d716e68dcdcce9a3932f3642d5fd955edb9dfd4f4a02212d1dc89a73dd1ad01b0',
  '0x04a4ba9bea745b2ddea726af71afe93cf32a628531f57bbce81c829287f8213fe68d3f3aab87fde1a87474e375bcac2b53ac691f9a711079ec64aed03a478c3b70',
  '0x0495f3deb57b0a88eacc5d920625b15ca869576935f7c139b304b7643b3f86030cb0e9384dc9367a7cc6391d2e70350d502a6b22014164b758a957376adfde45ca',
  '0x04d7396095b48600846ee208b46aaf00609ade20bbfbe12092a7f03b123c668bc0a127d21c340df0fb26a90e50f297dee4d2909539e6b918c2fc0c187c7b7ddb84',
  '0x0401914e8ed2cfa92898fae8e780d4df11101fde8d319a8b97b693ed73e19b35d5f0b930bc3917f0c38092e2e6cb7b5d15259e514bc78617647510ab0223bb706a',
  '0x047dd1865d0dbaa44390a28b8a521781fd768c03bbf41f0e0be535a00b1b44534746327dcd203f5fbbc667a957b87c6e7f6be5e3b6a60617c5d3e33380c0335494',
  '0x04d787e0b8cd4cb73d0210b1271a91fd50ebba1e4d15482db670c16a518b652652ab1110bbc57d0676b54f73158ce057a16d12747bed1b294959f1f26ee43d477c',
];
