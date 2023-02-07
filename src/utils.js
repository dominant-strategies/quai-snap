import { getShardContextForAddress } from './constants';
export const getShardForAddress = (addr) => {
  let chain = 'none';
  const context = getShardContextForAddress(addr);
  if (context[0] !== undefined) {
    chain = context[0].value;
  }
  return chain;
};
