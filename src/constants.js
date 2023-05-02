// constants

export const QUAI_CONTEXTS = [
  {
    name: 'Cyprus One',
    value: 'cyprus-1',
    nameNum: 'zone-0-0',
    byte: ['00', '1D'],
    id: '0x238d',
    httpPort: 8610,
    ws: 8611,
  },
  {
    name: 'Cyprus Two',
    value: 'cyprus-2',
    nameNum: 'zone-0-1',
    byte: ['1E', '3A'],
    id: '0x238e',
    httpPort: 8542,
    ws: 8543,
  },
  {
    name: 'Cyprus Three',
    value: 'cyprus-3',
    nameNum: 'zone-0-2',
    byte: ['3B', '57'],
    id: '0x238f',
    httpPort: 8674,
    ws: 8675,
  },
  {
    name: 'Paxos One',
    value: 'paxos-1',
    nameNum: 'zone-1-0',
    byte: ['58', '73'],
    id: '0x23f1',
    httpPort: 8512,
    ws: 8513,
  },
  {
    name: 'Paxos Two',
    value: 'paxos-2',
    nameNum: 'zone-1-1',
    byte: ['74', '8F'],
    id: '0x23f2',
    httpPort: 8544,
    ws: 8545,
  },
  {
    name: 'Paxos Three',
    value: 'paxos-3',
    nameNum: 'zone-1-2',
    byte: ['90', 'AB'],
    id: '0x23f3',
    httpPort: 8576,
    ws: 8577,
  },
  {
    name: 'Hydra One',
    value: 'hydra-1',
    nameNum: 'zone-2-0',
    byte: ['AC', 'C7'],
    id: '0x2455',
    httpPort: 8614,
    ws: 8615,
  },
  {
    name: 'Hydra Two',
    value: 'hydra-2',
    nameNum: 'zone-2-1',
    byte: ['C8', 'E3'],
    id: '0x2456',
    httpPort: 8646,
    ws: 8647,
  },
  {
    name: 'Hydra Three',
    value: 'hydra-3',
    nameNum: 'zone-2-2',
    byte: ['E4', 'FF'],
    id: '0x2457',
    httpPort: 8678,
    ws: 8679,
  },
];

export const shardsToFind = {
  'cyprus-1': { found: false, index: 0 },
  'cyprus-2': { found: false, index: 0 },
  'cyprus-3': { found: false, index: 0 },
  'paxos-1': { found: false, index: 0 },
  'paxos-2': { found: false, index: 0 },
  'paxos-3': { found: false, index: 0 },
  'hydra-1': { found: false, index: 0 },
  'hydra-2': { found: false, index: 0 },
  'hydra-3': { found: false, index: 0 },
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
