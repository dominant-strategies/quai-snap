import { QUAI_CONTEXTS } from './constants';
export const getShardForAddress = (address) => {
  return QUAI_CONTEXTS.filter((obj) => {
    const num = parseInt(Number(`0x${address.substring(2, 4)}`).toString(), 10);
    const start = parseInt(Number(`0x${obj.byte[0]}`).toString(), 10);
    const end = parseInt(Number(`0x${obj.byte[1]}`).toString(), 10);
    return num >= start && num <= end;
  });
};

export const removeWhitespace = (str) => {
  return str.replace(/\s/g, '');
};
