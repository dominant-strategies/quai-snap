export const CONFIG = {
  // Network URLs
  RPC_URL: 'https://rpc.quai.network',
  
  // Explorer URLs
  EXPLORER_BASE_URL: 'https://quaiscan.io',
  EXPLORER_ADDRESS_URL: (address: string) => `${CONFIG.EXPLORER_BASE_URL}/address/${address}`,
  EXPLORER_TX_URL: (hash: string) => `${CONFIG.EXPLORER_BASE_URL}/tx/${hash}`,
  
  // IPFS URLs
  IPFS_GATEWAY: 'https://ipfs.qu.ai',
  IPFS_URL: (cid: string) => `${CONFIG.IPFS_GATEWAY}/ipfs/${cid}`,
  
  // API URLs
  QUAISCAN_API_BASE: 'https://quaiscan.io/api/v2',
  QUAISCAN_API_TXS: (address: string) => `${CONFIG.QUAISCAN_API_BASE}/addresses/${address}/transactions?filter=to`,
} as const; 