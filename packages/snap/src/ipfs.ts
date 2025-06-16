import { Interface, type Provider, quais } from "quais";
import { decode } from 'cbor-x';
import bs58 from 'bs58';
import { arrayify } from "@ethersproject/bytes";
import { splitAuxdata, AuxdataStyle } from '@ethereum-sourcify/bytecode-utils';
import { CONFIG } from './config';

export type ContractABI = {
  type: string;
  name?: string;
  inputs?: { name: string; type: string }[];
  outputs?: { name: string; type: string }[];
  stateMutability?: string;
}[];

type MetadataSection = {
  ipfs?: Uint8Array | string | undefined;
  [key: string]: unknown;
};

export const decodeMultipleMetadataSections = async (bytecode: string): Promise<MetadataSection[]> => {
  if (!bytecode || bytecode.length === 0) {
      throw new Error('Bytecode cannot be empty');
  }

  const metadataSections: MetadataSection[] = [];
  let remainingBytecode = bytecode;

  while (remainingBytecode.length > 0) {
      try {
          const [executionBytecode, auxdata] = splitAuxdata(remainingBytecode, AuxdataStyle.SOLIDITY);

          if (auxdata) {
              const decodedMetadata = decode(arrayify(`0x${auxdata}`)) as MetadataSection;
              metadataSections.push(decodedMetadata);
              remainingBytecode = executionBytecode ?? '';
          } else {
              break;
          }
      } catch (error: any) {
          console.error('Failed to decode metadata section:', error);
          break;
      }
  }

  return metadataSections.map((metadata) => ({
      ...metadata,
      ipfs: metadata.ipfs ? bs58.encode(metadata.ipfs as Uint8Array) : undefined,
  }));
};

export const getABIFromAddress = async (address: string, provider: Provider, depth = 0): Promise<ContractABI | undefined> => {
    try {
      const resolvedAddress = quais.getAddress(address)
      const bytecode = await provider.getCode(resolvedAddress);
      if (bytecode === '0x' || bytecode === '0x0' || bytecode.length === 0) throw new Error('No contract found at this address');
      const metadataSections = await decodeMultipleMetadataSections(bytecode);
      if (metadataSections.length > 1) {
        console.warn(`Found ${metadataSections.length} metadata sections for address ${address}, using the first one`);
      } else if (metadataSections.length === 0) {
        // If no metadata is found, try to get the implementation from the bytecode (if it's a proxy)
        const impl = getImplementationFrom1167(bytecode);
        if (impl && depth < 5) {
            return getABIFromAddress(impl, provider, depth + 1);  // recurse once
        }

        throw new Error('ABI not found (no metadata, not a proxy)');
      }
      const ipfsCid = metadataSections[0]?.ipfs;
      if (!ipfsCid || typeof ipfsCid !== 'string') throw new Error('No IPFS metadata found in bytecode');
      // Fetch ABI from IPFS
      const url = CONFIG.IPFS_URL(ipfsCid);
      const response = await fetch(url);
      if (response.status < 200 || response.status >= 300) {
        throw new Error(`Failed to fetch metadata: ${response.statusText} (Status: ${response.status})`);
      }
      const metadata = await response.json();
      if (looksLikeTransparentProxyAbi(Interface.from(metadata.output.abi))) {
        // If the ABI is a transparent proxy, try to get the implementation from the storage slot
        const impl = await getImplementationFrom1967(provider, resolvedAddress);
        if (impl && depth < 5) {
          return getABIFromAddress(impl, provider, depth + 1);  // recurse once
        }
      }
      return metadata.output.abi; // Return the ABI
    } catch (e) {
      console.error(e)
    }
};

/**
 * If `code` is an EIP‑1167 minimal‑proxy return the embedded implementation
 * address, otherwise return `undefined`.
 * @param code - The bytecode to check for EIP-1167 proxy pattern
 * @returns The implementation address if it's an EIP-1167 proxy, undefined otherwise
 */
export function getImplementationFrom1167(code: string): string | undefined {
    // minimal‑proxy is always 45 bytes (0x2d) long
    const cleaned = code.replace(/^0x/, '').toLowerCase();
    if (cleaned.length !== 2 * 45) return;
  
    // opcode layout: … 36 3d 73 <20‑byte‑impl> 5a f4 3d 82 …
    const prefix  = '363d3d373d3d3d363d73';
    const suffix  = '5af43d82803e903d91602b57fd5bf3';
  
    if (!cleaned.startsWith(prefix) || !cleaned.endsWith(suffix)) return;
  
    const implHex = cleaned.slice(prefix.length, prefix.length + 40);
    return quais.getAddress('0x' + implHex);   // checksums & validates
  }

/**
 * Get the implementation address from a transparent proxy (EIP-1967)
 * @param provider - The provider to use for storage access
 * @param proxy - The proxy contract address
 * @returns The implementation address if found, undefined otherwise
 */
async function getImplementationFrom1967(
  provider: Provider,
  proxy: string,
): Promise<string | undefined> {
  // bytes32(uint256(keccak256('eip1967.proxy.implementation'))‑1)
  const slot =
    '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc';
  const raw = await provider.getStorage(proxy, slot);
  const addr = quais.getAddress('0x' + raw.slice(26)); // last 20 bytes
  if (addr === quais.ZeroAddress) return;
  // extra sanity: there must be *some* code at impl
  return (await provider.getCode(addr)) !== '0x' ? addr : undefined;
}

/**
 * Check if an ABI looks like a transparent proxy
 * @param abi - The ABI to check
 * @returns true if the ABI appears to be a transparent proxy
 */
function looksLikeTransparentProxyAbi(abi: Interface | undefined): boolean {
  if (!abi) return false;

  // "function" fragments are the ones that can actually be *called*
  // through `CALLDATA`.  A transparent proxy exposes no such functions
  // (the upgrade‑to‑and‑call selector is dispatched via `fallback`).
  const hasCallableFns = abi.fragments.some((f) => f.type === 'function');

  // true  → proxy  (needs another hop)
  // false → implementation
  return !hasCallableFns;
}

/**
 * Get ABI from IPFS with a timeout
 * @param address - The contract address
 * @param provider - The provider to use
 * @param timeoutMs - Maximum time to wait for IPFS response
 * @returns The contract ABI if found within timeout, undefined otherwise
 */
export async function getAbiFromIpfsWithTimeout(
  address: string,
  provider: Provider,
  timeoutMs = 5_000          // max amount of time to wait for the ABI to be fetched from IPFS
): Promise<ContractABI | undefined> {
  const abort = new AbortController();

  const fetchPromise = getABIFromAddress(address, provider)
    .catch(() => undefined);               // swallow all errors

  // A "sleep" that rejects after N ms
  const timer = new Promise<never>((_, rej) =>
    setTimeout(() => {
      abort.abort();                       // cancel http request
      console.error("ipfs-timeout");
      rej(new Error("ipfs-timeout"));
    }, timeoutMs)
  );

  // whichever settles first "wins"
  return Promise.race([fetchPromise, timer]).catch(() => undefined);
}

