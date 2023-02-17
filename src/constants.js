// constants
export const QUAI_MAINNET_NETWORK_ID = {
  prime: 9000,
  cyprus: 9100,
  paxos: 9200,
  hydra: 9300,
  'cyprus-1': 9101,
  'cyprus-2': 9102,
  'cyprus-3': 9103,
  'paxos-1': 9201,
  'paxos-2': 9202,
  'paxos-3': 9203,
  'hydra-1': 9301,
  'hydra-2': 9302,
  'hydra-3': 9303,
};

export const QUAI_MAINNET_CHAIN_ID = {
  Prime: '0x2328',
  Cyprus: '0x238c',
  Paxos: '0x23f0',
  Hydra: '0x2454',
  Cyprus1: '0x238d',
  Cyprus2: '0x238e',
  Cyprus3: '0x238f',
  Paxos1: '0x23f1',
  Paxos2: '0x23f2',
  Paxos3: '0x23f3',
  Hydra1: '0x2455',
  Hydra2: '0x2456',
  Hydra3: '0x2457',
};

export const QUAI_CONTEXTS = [
  {
    name: 'Prime',
    value: 'prime',
    nameNum: 'prime',
    byte: ['00', '09'],
    id: '0x2328',
    httpPort: 8546,
    ws: 8547,
  },
  {
    name: 'Cyprus',
    value: 'cyprus',
    nameNum: 'region-0',
    byte: ['0a', '13'],
    id: '0x238c',
    httpPort: 8578,
    ws: 8579,
  },
  {
    name: 'Cyprus One',
    value: 'cyprus-1',
    nameNum: 'zone-0-0',
    byte: ['14', '1d'],
    id: '0x238d',
    httpPort: 8610,
    ws: 8611,
  },
  {
    name: 'Cyprus Two',
    value: 'cyprus-2',
    nameNum: 'zone-0-1',
    byte: ['1e', '27'],
    id: '0x238e',
    httpPort: 8542,
    ws: 8543,
  },
  {
    name: 'Cyprus Three',
    value: 'cyprus-3',
    nameNum: 'zone-0-2',
    byte: ['28', '31'],
    id: '0x238f',
    httpPort: 8674,
    ws: 8675,
  },
  {
    name: 'Paxos',
    value: 'paxos',
    nameNum: 'region-1',
    byte: ['32', '3b'],
    id: '0x23f0',
    httpPort: 8580,
    ws: 8581,
  },
  {
    name: 'Paxos One',
    value: 'paxos-1',
    nameNum: 'zone-1-0',
    byte: ['3c', '45'],
    id: '0x23f1',
    httpPort: 8512,
    ws: 8513,
  },
  {
    name: 'Paxos Two',
    value: 'paxos-2',
    nameNum: 'zone-1-1',
    byte: ['46', '4f'],
    id: '0x23f2',
    httpPort: 8544,
    ws: 8545,
  },
  {
    name: 'Paxos Three',
    value: 'paxos-3',
    nameNum: 'zone-1-2',
    byte: ['50', '59'],
    id: '0x23f3',
    httpPort: 8576,
    ws: 8577,
  },
  {
    name: 'Hydra',
    value: 'hydra',
    nameNum: 'region-2',
    byte: ['5a', '63'],
    id: '0x2454',
    httpPort: 8582,
    ws: 8583,
  },
  {
    name: 'Hydra One',
    value: 'hydra-1',
    nameNum: 'zone-2-0',
    byte: ['64', '6d'],
    id: '0x2455',
    httpPort: 8614,
    ws: 8615,
  },
  {
    name: 'Hydra Two',
    value: 'hydra-2',
    nameNum: 'zone-2-1',
    byte: ['6e', '77'],
    id: '0x2456',
    httpPort: 8646,
    ws: 8647,
  },
  {
    name: 'Hydra Three',
    value: 'hydra-3',
    nameNum: 'zone-2-2',
    byte: ['78', '81'],
    id: '0x2457',
    httpPort: 8678,
    ws: 8679,
  },
];

export const QUAI_OPTIONS = [
  { name: 'Prime', value: 'prime' },
  { name: 'Cyprus', value: 'cyprus' },
  { name: 'Paxos', value: 'paxos' },
  { name: 'Hydra', value: 'hydra' },
  { name: 'Cyprus One', value: 'cyprus-1' },
  { name: 'Cyprus Two', value: 'cyprus-2' },
  { name: 'Cyprus Three', value: 'cyprus-3' },
  { name: 'Paxos One', value: 'paxos-1' },
  { name: 'Paxos Two', value: 'paxos-2' },
  { name: 'Paxos Three', value: 'paxos-3' },
  { name: 'Hydra One', value: 'hydra-1' },
  { name: 'Hydra Two', value: 'hydra-2' },
  { name: 'Hydra Three', value: 'hydra-3' },
];

export const shardsToFind = {
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

export const QUAI_SHARD_INDEX_MAPPINGS = {
  Prime: [0, 0],
  Cyprus: [0],
  'Cyprus-1': [0, 0],
  'Cyprus-2': [0, 1],
  'Cyprus-3': [0, 2],
  Paxos: [1],
  'Paxos-1': [1, 0],
  'Paxos-2': [1, 1],
  'Paxos-3': [1, 2],
  Hydra: [2],
  'Hydra-1': [2, 0],
  'Hydra-2': [2, 1],
  'Hydra-3': [2, 2],
};

export function getShardContextForAddress(address) {
  return QUAI_CONTEXTS.filter((obj) => {
    const num = parseInt(Number('0x' + address.substring(2, 4)), 10);
    const start = parseInt(Number('0x' + obj.byte[0]), 10);
    const end = parseInt(Number('0x' + obj.byte[1]), 10);
    return num >= start && num <= end;
  });
}

export function getChainData(chain) {
  return QUAI_CONTEXTS.filter((obj) => {
    return obj.value === chain;
  })[0];
}
